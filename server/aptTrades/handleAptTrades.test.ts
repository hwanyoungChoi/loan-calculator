import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { PAGE_SIZE } from "./buildUpstreamUrl";
import { handleAptTrades } from "./handleAptTrades";

import type { CacheLike } from "./monthCache";
import type { ApiError, AptTradesResponse } from "../../src/lib/types/aptTrade";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");

// + / = 가 섞여 인코딩 경로를 실제로 탄다
const KEY = "a+b/c=d";
const ENV = { MOLIT_SERVICE_KEY: KEY };
// KST 2026-01-15 → 202601, 202512, 202511
const NOW = () => new Date("2026-01-15T00:00:00+09:00");

type Reply = string | { status: number; body: string } | Error;

/** URL의 DEAL_YMD·pageNo로 응답을 고른다(달 조회가 병렬이라 호출 순서에 기대지 않는다) */
function fakeFetch(reply: (dealYmd: string, pageNo: number) => Reply) {
  return vi.fn<typeof fetch>(async (input) => {
    const params = new URL(String(input)).searchParams;
    const result = reply(params.get("DEAL_YMD") ?? "", Number(params.get("pageNo")));
    if (result instanceof Error) throw result;
    return typeof result === "string"
      ? new Response(result)
      : new Response(result.body, { status: result.status });
  });
}

function fakeCache(): CacheLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    match: async (key) => (store.has(key) ? new Response(store.get(key)) : undefined),
    put: async (key, response) => {
      store.set(key, await response.text());
    },
  };
}

const jsonItem = (aptNm: string, dealDay: number, dealAmount: string) => ({
  aptNm,
  cdealType: " ",
  dealAmount,
  dealYear: 2026,
  dealMonth: 1,
  dealDay,
  excluUseAr: 84,
  floor: 3,
  umdNm: "동",
});

const tradesJson = (items: object[], totalCount: number) =>
  JSON.stringify({
    response: {
      header: { resultCode: "000", resultMsg: "OK" },
      body: { items: items.length === 0 ? "" : { item: items }, totalCount },
    },
  });

const EMPTY = tradesJson([], 0);
const resultCodeJson = (code: string) =>
  JSON.stringify({ response: { header: { resultCode: code, resultMsg: "ERR" } } });

const tradesBody = async (response: Response) => (await response.json()) as AptTradesResponse;
const errorCode = async (response: Response) => ((await response.json()) as ApiError).error;

const call = (
  query: string,
  fetchImpl: typeof fetch,
  {
    method = "GET",
    env = ENV as { MOLIT_SERVICE_KEY?: string },
    cache = null as CacheLike | null,
  } = {},
) =>
  handleAptTrades(new Request(`https://app.test/api/apt-trades${query}`, { method }), env, {
    fetch: fetchImpl,
    now: NOW,
    cache,
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleAptTrades", () => {
  it("정상: 업스트림 URL, 필터, 정렬, 헤더", async () => {
    const fetchImpl = fakeFetch((dealYmd) => {
      if (dealYmd === "202601") return fixture("trades-multi.assumed.json");
      if (dealYmd === "202512") {
        return tradesJson(
          [jsonItem("래미안OO", 8, "90,000"), jsonItem("래미안OO", 8, "99,000")],
          2,
        );
      }
      return EMPTY;
    });

    const response = await call("?lawdCd=11680&aptName=%EB%9E%98%EB%AF%B8%EC%95%88OO", fetchImpl);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=600");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();

    const urls = fetchImpl.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls.map((url) => url.searchParams.get("DEAL_YMD")).sort()).toEqual([
      "202511",
      "202512",
      "202601",
    ]);
    for (const url of urls) {
      expect(url.searchParams.get("LAWD_CD")).toBe("11680");
      expect(url.searchParams.get("serviceKey")).toBe(KEY);
    }
    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);

    const body = await tradesBody(response);
    expect(body).not.toHaveProperty("totalCount");
    expect(body.months).toEqual(["202601", "202512", "202511"]);
    // "래미안 OO"(공백)와 "래미안OO"가 함께 걸리고, e편한세상·해제 거래는 빠진다
    // 달 경계를 넘어 dealDate 내림차순, 같은 날은 dealAmount 내림차순
    expect(body.items).toMatchObject([
      { aptName: "래미안OO", dealDate: "2026-01-08", dealAmount: 99000 },
      { aptName: "래미안OO", dealDate: "2026-01-08", dealAmount: 90000 },
      { aptName: "래미안 OO", dealDate: "2025-01-08", dealAmount: 115000 },
    ]);
  });

  it("aptName은 NFD 입력과 대소문자 차이도 일치시킨다", async () => {
    const fetchImpl = fakeFetch(() => fixture("trades-multi.assumed.json"));
    const query = `?lawdCd=11680&months=1&aptName=${encodeURIComponent("E편한세상".normalize("NFD"))}`;
    const body = await tradesBody(await call(query, fetchImpl));
    expect(body.items.map((t) => t.aptName)).toEqual(["e편한세상 파크"]);
  });

  it("검증 실패·메서드·키 없음은 업스트림을 부르지 않는다", async () => {
    const fetchImpl = fakeFetch(() => EMPTY);

    const invalid = await call("?lawdCd=99999", fetchImpl);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "invalidParams", message: expect.any(String) });
    expect(invalid.headers.get("Cache-Control")).toBe("no-store");

    const post = await call("?lawdCd=11680", fetchImpl, { method: "POST" });
    expect(post.status).toBe(405);
    expect(post.headers.get("Allow")).toBe("GET");
    expect(await errorCode(post)).toBe("methodNotAllowed");

    for (const env of [{}, { MOLIT_SERVICE_KEY: " \n" }]) {
      const response = await call("?lawdCd=11680", fetchImpl, { env });
      expect(response.status).toBe(503);
      expect(await errorCode(response)).toBe("notConfigured");
    }

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each<[string, Reply, number, string]>([
    ["게이트웨이 30(JSON, 실제)", fixture("gateway-error.real.json"), 503, "notConfigured"],
    [
      "게이트웨이 30(XML) + HTTP 401",
      { status: 401, body: fixture("gateway-error.assumed.xml") },
      503,
      "notConfigured",
    ],
    ["resultCode 20", resultCodeJson("20"), 503, "notConfigured"],
    ["resultCode 31", resultCodeJson("31"), 503, "notConfigured"],
    ["resultCode 22", resultCodeJson("22"), 429, "quotaExceeded"],
    ["resultCode 23", resultCodeJson("23"), 429, "rateLimited"],
    ["resultCode 99", resultCodeJson("99"), 502, "upstream"],
    ["빈 본문", "", 502, "upstream"],
    ["HTML 본문", "<html><body>error</body></html>", 502, "upstream"],
    ["HTTP 500 + 코드 없음", { status: 500, body: "Internal Server Error" }, 502, "upstream"],
    ["fetch TypeError", new TypeError("fetch failed"), 502, "upstream"],
    ["타임아웃", new DOMException("", "TimeoutError"), 504, "upstreamTimeout"],
  ])("오류 매핑: %s → %i %s", async (_, reply, status, error) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await call(
      "?lawdCd=11680",
      fakeFetch(() => reply),
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error, message: expect.any(String) });
    if (error === "rateLimited") expect(response.headers.get("Retry-After")).toBe("2");
  });

  it("여러 달 실패가 섞이면 429 > 504 > 502", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const mixed = (replies: Record<string, Reply>) => fakeFetch((dealYmd) => replies[dealYmd]);

    const quota = await call(
      "?lawdCd=11680",
      mixed({
        "202601": "",
        "202512": new DOMException("", "TimeoutError"),
        "202511": resultCodeJson("22"),
      }),
    );
    expect(await errorCode(quota)).toBe("quotaExceeded");

    const timeout = await call(
      "?lawdCd=11680",
      mixed({ "202601": "", "202512": new DOMException("", "TimeoutError"), "202511": EMPTY }),
    );
    expect(await errorCode(timeout)).toBe("upstreamTimeout");
  });

  it.each([
    [1000, 1, 200],
    [1001, 2, 200],
    [5000, 5, 200],
    [5001, 5, 502],
  ])("페이지 순회: totalCount %i → %i페이지, %i", async (total, pages, status) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const row = jsonItem("단지", 1, "10,000");
    const fetchImpl = fakeFetch((_, pageNo) => {
      const rows = Math.max(0, Math.min(PAGE_SIZE, total - (pageNo - 1) * PAGE_SIZE));
      return tradesJson(Array(rows).fill(row), total);
    });
    const response = await call("?lawdCd=11680&months=1", fetchImpl);
    expect(response.status).toBe(status);
    expect(fetchImpl).toHaveBeenCalledTimes(pages);
  });

  it("빈 페이지가 이어지면 5페이지 상한에서 끊고 502", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = fakeFetch(() => tradesJson([], 3000));
    const response = await call("?lawdCd=11680&months=1", fetchImpl);
    expect(response.status).toBe(502);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });

  it("캐시: 같은 달은 두 번째에 업스트림을 부르지 않고, aptName·키는 캐시 키에 없다", async () => {
    const cache = fakeCache();
    const fetchImpl = fakeFetch(() => fixture("trades-multi.assumed.json"));

    await call("?lawdCd=11680&months=1&aptName=a", fetchImpl, { cache });
    const second = await call("?lawdCd=11680&months=1&aptName=b", fetchImpl, { cache });

    expect(second.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect([...cache.store.keys()]).toEqual(["https://cache.internal/apt-trades/11680/202601"]);
  });

  it("캐시: 실패는 저장하지 않는다", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache = fakeCache();
    await call(
      "?lawdCd=11680&months=1",
      fakeFetch(() => resultCodeJson("99")),
      { cache },
    );
    expect(cache.store.size).toBe(0);
  });

  it("키 비노출: 키가 든 예외 메시지도 응답·로그에 남지 않는다", async () => {
    const logs = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
    const leaky = vi.fn<typeof fetch>(async (input) => {
      throw new Error(`request to ${String(input)} failed`);
    });
    const throwingCache: CacheLike = {
      match: async () => {
        throw new Error(`cache failed for ${KEY}`);
      },
      put: async () => {},
    };

    const responses = [
      await call("?lawdCd=11680", leaky),
      await call("?lawdCd=11680", leaky, { cache: throwingCache }),
    ];
    expect(responses.map((r) => r.status)).toEqual([502, 500]);
    expect(await responses[1].clone().json()).toEqual({
      error: "internal",
      message: expect.any(String),
    });

    for (const response of responses) {
      const text = await response.text();
      const headers = JSON.stringify([...response.headers]);
      for (const form of [KEY, encodeURIComponent(KEY)]) {
        expect(text).not.toContain(form);
        expect(headers).not.toContain(form);
      }
    }
    const logged = JSON.stringify(logs.flatMap((spy) => spy.mock.calls));
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain(encodeURIComponent(KEY));
  });
});

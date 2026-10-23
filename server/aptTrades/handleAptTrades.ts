import { buildUpstreamUrl } from "./buildUpstreamUrl";
import { readMonthCache, writeMonthCache } from "./monthCache";
import { parseQuery } from "./parseQuery";
import { parseTradesResponse } from "./parseTradesResponse";
import { recentMonths } from "./recentMonths";
import { errorResponse, jsonResponse } from "../http/response";

import type { CacheLike } from "./monthCache";
import type { AptTrade, AptTradesResponse } from "../../src/lib/types/aptTrade";

/** 요청 전체(모든 달·페이지)가 공유하는 타임아웃 */
const TIMEOUT_MS = 15_000;
/** 달마다 읽는 페이지 상한. 6달 × 5페이지 = 30 서브요청(Workers 무료 한도 50 안) */
const MAX_PAGES_PER_MONTH = 5;

const SOURCE: AptTradesResponse["source"] = {
  name: "국토교통부 아파트 매매 실거래가",
  url: "https://www.data.go.kr/data/15126469/openapi.do",
};

type Env = { MOLIT_SERVICE_KEY?: string };
type Deps = { fetch: typeof fetch; now: () => Date; cache: CacheLike | null };

type UpstreamFailure = {
  error: "notConfigured" | "quotaExceeded" | "rateLimited" | "upstreamTimeout" | "upstream";
  code: string | null;
};
type MonthResult = { ok: true; items: AptTrade[] } | { ok: false; failure: UpstreamFailure };

// 여러 달의 실패가 섞이면 앞쪽을 돌려준다(429 > 504 > 502). 503은 키 문제라 모든 달에 같이 나온다.
const FAILURE_PRIORITY: UpstreamFailure["error"][] = [
  "notConfigured",
  "quotaExceeded",
  "rateLimited",
  "upstreamTimeout",
  "upstream",
];

const FAILURE_RESPONSE: Record<UpstreamFailure["error"], { status: number; message: string }> = {
  notConfigured: { status: 503, message: "서비스키 설정을 확인해야 합니다" },
  quotaExceeded: { status: 429, message: "업스트림 일일 호출 한도를 넘었습니다" },
  rateLimited: { status: 429, message: "업스트림 초당 호출 한도를 넘었습니다" },
  upstreamTimeout: { status: 504, message: "업스트림 응답 시간이 초과됐습니다" },
  upstream: { status: 502, message: "업스트림 응답을 처리하지 못했습니다" },
};

export async function handleAptTrades(request: Request, env: Env, deps: Deps): Promise<Response> {
  // deps.fetch(url)로 부르면 Workers에서 Illegal invocation이 날 수 있어 구조 분해해서 쓴다.
  const { fetch: fetchImpl, now, cache } = deps;

  try {
    const query = parseQuery(new URL(request.url).searchParams);
    if (!query.ok) return errorResponse(400, "invalidParams", query.message);

    const serviceKey = env.MOLIT_SERVICE_KEY?.trim() ?? "";
    if (serviceKey === "") {
      return errorResponse(503, "notConfigured", "서비스키가 등록되지 않았습니다");
    }

    const months = recentMonths(now(), query.months);
    const signal = AbortSignal.timeout(TIMEOUT_MS);

    const loadMonth = async (dealYmd: string): Promise<MonthResult> => {
      const cached = await readMonthCache(cache, query.lawdCd, dealYmd);
      if (cached !== null) return { ok: true, items: cached };

      const items: AptTrade[] = [];
      let rowCount = 0;
      for (let pageNo = 1; pageNo <= MAX_PAGES_PER_MONTH; pageNo++) {
        const url = buildUpstreamUrl({ serviceKey, lawdCd: query.lawdCd, dealYmd, pageNo });
        const page = await fetchPage(fetchImpl, url, signal);
        if (!page.ok) return page;
        items.push(...page.items);
        rowCount += page.rowCount;
        if (rowCount >= page.upstreamTotal) {
          await writeMonthCache(cache, query.lawdCd, dealYmd, items, dealYmd === months[0]);
          return { ok: true, items };
        }
      }
      return { ok: false, failure: { error: "upstream", code: null } };
    };

    const results = await Promise.all(months.map(loadMonth));

    const failures = results.flatMap((result) => (result.ok ? [] : [result.failure]));
    if (failures.length > 0) {
      const failure = FAILURE_PRIORITY.flatMap(
        (error) => failures.find((f) => f.error === error) ?? [],
      )[0];
      // URL·응답 원문은 남기지 않는다(키가 들어 있다).
      // eslint-disable-next-line no-console
      console.warn("apt-trades upstream failure", failure.error, failure.code);
      const { status, message } = FAILURE_RESPONSE[failure.error];
      return errorResponse(
        status,
        failure.error,
        failure.code === null ? message : `${message} (코드 ${failure.code})`,
        failure.error === "rateLimited" ? { "Retry-After": "2" } : {},
      );
    }

    const nameQuery = normalizeName(query.aptName);
    const items = results
      .flatMap((result) => (result.ok ? result.items : []))
      .filter((trade) => normalizeName(trade.aptName).includes(nameQuery))
      .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.dealAmount - a.dealAmount);

    const body: AptTradesResponse = { lawdCd: query.lawdCd, months, items, source: SOURCE };
    return jsonResponse(200, body, { "Cache-Control": "public, max-age=600" });
  } catch (error) {
    // 예외 message에는 키가 든 URL이 있을 수 있어 이름만 남긴다.
    // eslint-disable-next-line no-console
    console.error("apt-trades internal error", error instanceof Error ? error.name : typeof error);
    return errorResponse(500, "internal", "서버 오류가 발생했습니다");
  }
}

type PageResult =
  | { ok: true; items: AptTrade[]; rowCount: number; upstreamTotal: number }
  | { ok: false; failure: UpstreamFailure };

async function fetchPage(
  fetchImpl: typeof fetch,
  url: string,
  signal: AbortSignal,
): Promise<PageResult> {
  let response: Response;
  let body: string;
  try {
    response = await fetchImpl(url, { signal });
    body = await response.text();
  } catch (error) {
    const isTimeout =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ok: false,
      failure: { error: isTimeout ? "upstreamTimeout" : "upstream", code: null },
    };
  }

  const parsed = parseTradesResponse(body);
  if (parsed.ok) {
    return response.ok ? parsed : { ok: false, failure: { error: "upstream", code: null } };
  }
  return { ok: false, failure: { error: errorForCode(parsed.code), code: parsed.code } };
}

function errorForCode(code: string | null): UpstreamFailure["error"] {
  switch (code) {
    case "20": // 접근 거부/키 없음
    case "30": // 키 미등록(승인 직후 활성화 지연 포함)
    case "31": // 키 기한 만료
      return "notConfigured";
    case "22":
      return "quotaExceeded";
    case "23":
      return "rateLimited";
    default:
      return "upstream";
  }
}

/** aptName 필터 비교용: NFC, 공백 제거, 소문자 */
const normalizeName = (name: string) => name.normalize("NFC").replace(/\s/gu, "").toLowerCase();

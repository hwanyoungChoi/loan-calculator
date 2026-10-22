import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseTradesResponse } from "./parseTradesResponse";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");

describe("parseTradesResponse (real fixture: 종로구 202609, 2026-10-22 수집)", () => {
  it("여러 건: 숫자·문자열 혼합 필드를 AptTrade로 읽는다", () => {
    expect(parseTradesResponse(fixture("trades-multi.real.json"))).toEqual({
      ok: true,
      rowCount: 3,
      upstreamTotal: 32,
      items: [
        {
          aptName: "경희궁자이(2단지)",
          umdName: "홍파동",
          exclusiveArea: 59.8547,
          floor: 18,
          dealAmount: 236500,
          dealDate: "2026-09-28",
        },
        {
          aptName: "경희궁자이(2단지)",
          umdName: "홍파동",
          exclusiveArea: 101.9914,
          floor: 2,
          dealAmount: 316000,
          dealDate: "2026-09-23",
        },
        {
          aptName: "이화에수풀",
          umdName: "연건동",
          exclusiveArea: 16.98,
          floor: 7,
          dealAmount: 19800,
          dealDate: "2026-09-28",
        },
      ],
    });
  });

  it('1건(item 객체)은 배열과 같은 모양, 0건(items "")은 빈 배열', () => {
    const single = parseTradesResponse(fixture("trades-single.real.json"));
    expect(single).toMatchObject({ ok: true, rowCount: 1, items: [{ dealAmount: 236500 }] });
    expect(parseTradesResponse(fixture("trades-empty.real.json"))).toEqual({
      ok: true,
      items: [],
      rowCount: 0,
      upstreamTotal: 0,
    });
  });

  it("키 오류(게이트웨이 형식, HTTP 200)에서 코드를 읽는다", () => {
    expect(parseTradesResponse(fixture("gateway-error.real.json"))).toEqual({
      ok: false,
      code: "30",
    });
  });

  it.todo("실제 해제 거래(cdealType) 표시 값 — 해제 건이 든 실제 응답을 받으면 채운다");
});

describe("parseTradesResponse (assumed fixture)", () => {
  it("공백 붙은 금액, 날짜 0 채움, 공백 한 칸 필드 null, 지하층, 해제 거래 제외", () => {
    expect(parseTradesResponse(fixture("trades-multi.assumed.json"))).toEqual({
      ok: true,
      rowCount: 3,
      upstreamTotal: 3,
      items: [
        {
          aptName: "래미안 OO",
          umdName: "대치동",
          exclusiveArea: 84.97,
          floor: 12,
          dealAmount: 115000,
          dealDate: "2025-01-08",
        },
        {
          aptName: "e편한세상 파크",
          umdName: null,
          exclusiveArea: 59,
          floor: null,
          dealAmount: 98000,
          dealDate: "2025-01-15",
        },
      ],
    });
  });

  it.each(["aptNm", "excluUseAr", "dealAmount", "dealYear", "dealMonth", "dealDay"])(
    "필수 필드 %s가 없으면 실패(코드 없음)",
    (field) => {
      const document = JSON.parse(fixture("trades-single.real.json"));
      delete document.response.body.items.item[field];
      expect(parseTradesResponse(JSON.stringify(document))).toEqual({ ok: false, code: null });
    },
  );

  it("정상 형식 안의 resultCode 오류, XML 게이트웨이 오류", () => {
    const resultCode22 = JSON.stringify({
      response: { header: { resultCode: "22", resultMsg: "LIMITED" } },
    });
    expect(parseTradesResponse(resultCode22)).toEqual({ ok: false, code: "22" });
    expect(parseTradesResponse(fixture("gateway-error.assumed.xml"))).toEqual({
      ok: false,
      code: "30",
    });
  });

  it.each([[""], ["<html><body>Bad Gateway</body></html>"], ["not json"], ['{"response":{}}']])(
    "읽을 수 없는 본문은 실패(코드 없음): %j",
    (body) => {
      expect(parseTradesResponse(body)).toEqual({ ok: false, code: null });
    },
  );
});

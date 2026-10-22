import { describe, expect, it } from "vitest";

import { parseListingText } from "./parseListingText";

/**
 * 화면 텍스트 샘플은 `__fixtures__/screenText/`의 파일 쌍(`NN-name.txt` + `NN-name.expected.json`)이다.
 * 실제 스크린샷의 OCR 결과(U5)는 파일 2개를 추가하면 여기서 돈다. 가정 샘플은 `assumed-` 접두이고,
 * 실제 샘플의 기대값에는 ok·salePrice 또는 reason만 적는다(toMatchObject라 적은 필드만 비교한다).
 */
const texts = import.meta.glob<string>("./__fixtures__/screenText/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});
const expectations = import.meta.glob<object>("./__fixtures__/screenText/*.expected.json", {
  import: "default",
  eager: true,
});
const fixtures = Object.entries(texts).map(([path, text]) => ({
  name: path.replace(/^.*\/|\.txt$/g, ""),
  text,
  expected: expectations[path.replace(/\.txt$/, ".expected.json")],
}));

describe("parseListingText (AC-1)", () => {
  it.each(fixtures)("$name", ({ text, expected }) => {
    expect(expected).toBeDefined();
    expect(parseListingText(text)).toMatchObject(expected);
  });

  it.each([
    { name: "빈 텍스트", text: " \n ", expected: { ok: false, reason: "empty" } },
    {
      name: "매매 없이 금액만",
      text: "12억 5,000",
      expected: { ok: false, reason: "priceNotFound" },
    },
    { name: "띄어 읽은 전세", text: "전 세 7억", expected: { ok: false, reason: "notSale" } },
    { name: "띄어 읽은 월세", text: "월 세 1,000/100", expected: { ok: false, reason: "notSale" } },
    {
      name: "전세가 앞에 있어도 매매 뒤 금액",
      text: "전세 7억 매매 12억 5,000",
      expected: { salePrice: 125000 },
    },
    { name: "띄어 읽은 억·천", text: "매매 9 억 5 천", expected: { salePrice: 95000 } },
    { name: "띄어 읽은 천만원", text: "매매 5 천만원", expected: { salePrice: 5000 } },
    { name: "층은 금액이 아니다", text: "매매 25 층 9 억 8 천", expected: { salePrice: 98000 } },
    {
      name: "뒤의 관리비는 매매가가 아니다",
      text: "매매 12 억\n관리비 25 만원",
      expected: { salePrice: 120000 },
    },
    {
      name: "층·면적 숫자는 금액 단위와 붙지 않는다",
      text: "매매 25/35 층 84 ㎡ 11억",
      expected: { salePrice: 110000, areaText: "84㎡" },
    },
    {
      name: "양쪽에 단위가 있는 공급/전용 쌍은 전용",
      text: "매매 12억\n공급/전용 112.39㎡/84.97㎡",
      expected: { areaText: "84.97㎡" },
    },
    {
      name: "한글 없는 상태 표시줄은 단지명이 아니다",
      text: "9:41 al LTE @\n매매 12억",
      expected: { complexName: null },
    },
    {
      name: "단지명 앞뒤 기호와 동 번호를 뗀다",
      text: "‹ 헬리오시티 101동 @\n매매 9억",
      expected: { complexName: "헬리오시티", suggestedName: "헬리오시티" },
    },
    {
      name: "단지명의 괄호는 남긴다",
      text: "OO아파트(1차)\n매매 9억",
      expected: { complexName: "OO아파트(1차)" },
    },
  ])("$name", ({ text, expected }) => {
    expect(parseListingText(text)).toMatchObject(expected);
  });
});

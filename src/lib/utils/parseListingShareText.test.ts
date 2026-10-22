import { describe, expect, it } from "vitest";

import { parseListingShareText } from "./parseListingShareText";

/**
 * 공유 텍스트 샘플은 `__fixtures__/shareText/`의 파일 쌍(`NN-name.txt` + `NN-name.expected.json`)이다.
 * 실제 샘플(U3)은 파일 2개를 추가하면 여기서 돈다. 가정 샘플은 `assumed-` 접두이고,
 * complexName은 가정 샘플의 기대값에만 적는다(실제 샘플은 ok·salePrice 또는 reason만).
 */
const texts = import.meta.glob<string>("./__fixtures__/shareText/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});
const expectations = import.meta.glob<object>("./__fixtures__/shareText/*.expected.json", {
  import: "default",
  eager: true,
});
const fixtures = Object.entries(texts).map(([path, text]) => ({
  name: path.replace(/^.*\/|\.txt$/g, ""),
  text,
  expected: expectations[path.replace(/\.txt$/, ".expected.json")],
}));

describe("parseListingShareText (AC-7b)", () => {
  it.each(fixtures)("$name", ({ text, expected }) => {
    expect(expected).toBeDefined();
    expect(parseListingShareText(text)).toMatchObject(expected);
  });

  it("URL만 있으면 링크는 읽지 않는다고 알린다", () => {
    expect(parseListingShareText(" https://new.land.naver.com/x?articleNo=0\n")).toEqual({
      ok: false,
      reason: "linkOnly",
    });
  });

  it("전세 금액이 앞에 있어도 매매 뒤 첫 금액을 읽는다", () => {
    expect(parseListingShareText("전세 7억 매매 12억 5,000")).toMatchObject({ salePrice: 125000 });
  });

  it("매매 뒤의 층수는 금액이 아니고, 천 단위는 만원 자리로 읽는다", () => {
    expect(parseListingShareText("매매 25층 9억 8천")).toMatchObject({ salePrice: 98000 });
  });
});

import { describe, expect, it } from "vitest";

import { formatManwon, MAX_AMOUNT } from "./amount";
import { parseKoreanPrice } from "./parseKoreanPrice";

describe("parseKoreanPrice (AC-7a)", () => {
  it.each([
    ["12억 5,000", 125000],
    ["12억5000만원", 125000],
    ["12억 5천", 125000],
    ["125,000만원", 125000],
    ["9억 8천", 98000],
    ["8,500", 8500],
    ["12억 5,000", 125000],
  ])("%s → %d", (text, expected) => {
    expect(parseKoreanPrice(text)).toBe(expected);
  });

  it.each(["12", "5000", "0억", "억", "", "12.5억", "1조", "125,000원", "１２억", "100,000억"])(
    "%s → null",
    (text) => {
      expect(parseKoreanPrice(text)).toBeNull();
    },
  );

  it.each([1, 9999, 10000, 12500, 120000, MAX_AMOUNT])("formatManwon(%d)을 되읽는다", (n) => {
    expect(parseKoreanPrice(formatManwon(n))).toBe(n);
  });
});

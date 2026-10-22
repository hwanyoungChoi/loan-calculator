import { describe, expect, it } from "vitest";

import { toLoanInput } from "./toLoanInput";

import type { Draft } from "@/lib/types/draft";

const DRAFT: Draft = {
  salePrice: "100000",
  kbPrice: "90000",
  region: "regulated",
  borrower: "noHome",
  listingId: null,
  customLtv: null,
};

describe("toLoanInput: 사용자 지정 LTV (AC-3, ADR-012 변환 지점)", () => {
  it("직접 입력이 꺼져 있으면(null) customLtvRate 키를 넣지 않는다", () => {
    const input = toLoanInput(DRAFT);
    expect(input).toEqual({
      salePrice: 100000,
      kbPrice: 90000,
      region: "regulated",
      borrower: "noHome",
    });
    expect(input !== null && Object.hasOwn(input, "customLtvRate")).toBe(false);
  });

  it.each<[string, number]>([
    ["70", 70],
    ["70%", 70],
    [" 70% ", 70],
    ["070", 70],
    ["0", 0],
    ["100", 100],
  ])("켜져 있고 %j가 유효하면 정규화한 숫자 %i를 넣는다", (customLtv, customLtvRate) => {
    expect(toLoanInput({ ...DRAFT, customLtv })).toEqual({
      salePrice: 100000,
      kbPrice: 90000,
      region: "regulated",
      borrower: "noHome",
      customLtvRate,
    });
  });

  it.each(["", "   ", "70.5", "101", "-1", "abc", "70 %"])(
    "켜져 있는데 %j(빈 값·오류)면 계산 입력을 만들지 않는다(null)",
    (customLtv) => {
      expect(toLoanInput({ ...DRAFT, customLtv })).toBeNull();
    },
  );

  it("금액이 틀리면 LTV가 유효해도 null이다", () => {
    expect(toLoanInput({ ...DRAFT, salePrice: "0", customLtv: "70" })).toBeNull();
    expect(toLoanInput({ ...DRAFT, kbPrice: "", customLtv: "70" })).toBeNull();
  });
});

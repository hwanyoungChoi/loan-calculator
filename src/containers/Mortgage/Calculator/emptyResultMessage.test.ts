import { describe, expect, it } from "vitest";

import { describeEmptyResult } from "./emptyResultMessage";

import type { Draft } from "@/lib/types/draft";

const DRAFT: Draft = {
  salePrice: "100000",
  kbPrice: "100000",
  region: "regulated",
  borrower: "noHome",
  listingId: null,
  customLtv: "",
  isCustomLtvInput: false,
  isAreaOver85: false,
  extraCosts: [],
};

describe("describeEmptyResult (결과 카드 빈 상태 안내)", () => {
  it("금액이 갖춰졌고 직접 입력이 켠 채 비었으면 LTV 안내", () => {
    expect(describeEmptyResult(DRAFT)).toBe("LTV를 입력하거나 다른 LTV를 고르세요");
  });

  it("직접 입력 값이 오류여도 LTV 안내", () => {
    expect(describeEmptyResult({ ...DRAFT, customLtv: "101" })).toBe(
      "LTV를 입력하거나 다른 LTV를 고르세요",
    );
  });

  it("금액이 덜 됐으면 금액 안내가 먼저다", () => {
    expect(describeEmptyResult({ ...DRAFT, kbPrice: "" })).toBe("매매가와 KB시세를 입력하세요");
    expect(describeEmptyResult({ ...DRAFT, salePrice: "0", customLtv: null })).toBe(
      "매매가와 KB시세를 입력하세요",
    );
  });
});

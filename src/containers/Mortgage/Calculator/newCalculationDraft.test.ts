import { describe, expect, it } from "vitest";

import { toNewCalculationDraft } from "./newCalculationDraft";

import type { Draft } from "@/lib/types/draft";

describe("toNewCalculationDraft ('새 계산', AC-3e, ADR-013, ADR-022)", () => {
  it("금액·listingId를 비우고 LTV 직접 입력을 기본 70으로, 85㎡ 초과를 끔으로 되돌린다. 소재지·보유 상태는 유지한다", () => {
    const draft: Draft = {
      salePrice: "125000",
      kbPrice: "120000",
      region: "capitalNonRegulated",
      borrower: "noHomePreferred",
      listingId: "listing-a",
      customLtv: "55",
      isCustomLtvInput: true,
      isAreaOver85: true,
    };
    expect(toNewCalculationDraft(draft)).toEqual({
      salePrice: "",
      kbPrice: "",
      region: "capitalNonRegulated",
      borrower: "noHomePreferred",
      listingId: null,
      customLtv: "70",
      isCustomLtvInput: false,
      isAreaOver85: false,
    });
  });

  it("켠 채 비어 있던 입력('')도 기본 70으로 되돌린다", () => {
    const draft: Draft = {
      salePrice: "",
      kbPrice: "",
      region: "regulated",
      borrower: "noHome",
      listingId: null,
      customLtv: "",
      isCustomLtvInput: false,
      isAreaOver85: false,
    };
    expect(toNewCalculationDraft(draft).customLtv).toBe("70");
  });
});

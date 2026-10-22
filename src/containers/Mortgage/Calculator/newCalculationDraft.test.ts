import { describe, expect, it } from "vitest";

import { toNewCalculationDraft } from "./newCalculationDraft";

import type { Draft } from "@/lib/types/draft";

describe("toNewCalculationDraft ('새 계산', AC-3e, ADR-013)", () => {
  it("금액·listingId를 비우고 LTV 직접 입력을 끈다. 소재지·보유 상태는 유지한다", () => {
    const draft: Draft = {
      salePrice: "125000",
      kbPrice: "120000",
      region: "capitalNonRegulated",
      borrower: "noHomePreferred",
      listingId: "listing-a",
      customLtv: "70",
    };
    expect(toNewCalculationDraft(draft)).toEqual({
      salePrice: "",
      kbPrice: "",
      region: "capitalNonRegulated",
      borrower: "noHomePreferred",
      listingId: null,
      customLtv: null,
    });
  });

  it("켠 채 비어 있던 입력('')도 끈다", () => {
    const draft: Draft = {
      salePrice: "",
      kbPrice: "",
      region: "regulated",
      borrower: "noHome",
      listingId: null,
      customLtv: "",
    };
    expect(toNewCalculationDraft(draft).customLtv).toBeNull();
  });
});

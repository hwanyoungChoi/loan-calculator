import { describe, expect, it } from "vitest";

import { applyListingText } from "./applyListingText";

import type { Draft } from "@/lib/types/draft";

describe("applyListingText (AC-2)", () => {
  it("매매가를 채우고 KB시세를 비우고 매물 연결과 사용자 지정 LTV를 푼다. 소재지·보유 상태는 유지한다", () => {
    const draft: Draft = {
      salePrice: "100000",
      kbPrice: "98000",
      region: "regulated",
      borrower: "noHome",
      listingId: "listing-a",
      customLtv: "70",
    };
    const parsed = {
      ok: true as const,
      salePrice: 125000,
      complexName: "래미안OO",
      areaText: "84㎡",
      suggestedName: "래미안OO 84㎡",
    };
    expect(applyListingText(draft, parsed)).toEqual({
      ...draft,
      salePrice: "125000",
      kbPrice: "",
      listingId: null,
      customLtv: null,
    });
  });
});

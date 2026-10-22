import type { Draft } from "@/lib/types/draft";

/** 처음 열 때의 입력. 가장 LTV가 낮은 규제지역·무주택이라 결과를 과대하게 보여줄 위험이 작다(ADR-009). */
export const DEFAULT_DRAFT: Draft = {
  salePrice: "",
  kbPrice: "",
  region: "regulated",
  borrower: "noHome",
  listingId: null,
  customLtv: null,
};

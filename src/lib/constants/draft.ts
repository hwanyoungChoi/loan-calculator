import type { Draft } from "@/lib/types/draft";

/**
 * LTV 직접 입력의 기본값. 규제 값이 아니라 요청자가 익숙한 "낮은 금액의 70%" 계산을 바로 보여 주는 입력값이다(ADR-022 D1).
 * 규제 기준 LTV는 결과 카드에 나란히 보인다.
 */
export const DEFAULT_CUSTOM_LTV = "70";

/** LTV 칩으로 고르는 사용자 지정 값(%). 그 밖의 값은 [직접 입력]이다. */
export const LTV_PRESETS = ["40", "70", "80"] as const;

/** 처음 열 때의 입력. 소재지·보유 상태는 규제지역·무주택이라 규제 기준 LTV가 가장 낮게 병기된다(ADR-009). */
export const DEFAULT_DRAFT: Draft = {
  salePrice: "",
  kbPrice: "",
  region: "regulated",
  borrower: "noHome",
  listingId: null,
  customLtv: DEFAULT_CUSTOM_LTV,
  isCustomLtvInput: false,
  isAreaOver85: false,
};

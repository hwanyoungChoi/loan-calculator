import { DEFAULT_CUSTOM_LTV } from "@/lib/constants/draft";

import type { Draft } from "@/lib/types/draft";
import type { ParsedListingText } from "@/lib/utils/parseListingText";

/**
 * 스크린샷 "적용"은 새 매물 계산이다(ADR-017): 매매가를 채우고, 이전 매물의 KB시세가 섞이지 않게 비우고,
 * 편집 중이던 매물을 덮어쓰지 않게 연결을 푼다. LTV와 85㎡ 초과는 "새 계산"과 같은 이유로 기본값으로 돌린다(ADR-022).
 */
export function applyListingText(draft: Draft, parsed: ParsedListingText): Draft {
  return {
    ...draft,
    salePrice: String(parsed.salePrice),
    kbPrice: "",
    listingId: null,
    customLtv: DEFAULT_CUSTOM_LTV,
    isCustomLtvInput: false,
    isAreaOver85: false,
  };
}

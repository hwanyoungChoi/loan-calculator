import type { Draft } from "@/lib/types/draft";
import type { ParsedListingText } from "@/lib/utils/parseListingText";

/**
 * 스크린샷 "적용"은 새 매물 계산이다(ADR-017): 매매가를 채우고, 이전 매물의 KB시세가 섞이지 않게 비우고,
 * 편집 중이던 매물을 덮어쓰지 않게 연결을 푼다. 은행 상담 LTV는 이전 매물의 값이라 끈다("새 계산"과 같은 이유, ADR-013).
 */
export function applyListingText(draft: Draft, parsed: ParsedListingText): Draft {
  return {
    ...draft,
    salePrice: String(parsed.salePrice),
    kbPrice: "",
    listingId: null,
    customLtv: null,
  };
}

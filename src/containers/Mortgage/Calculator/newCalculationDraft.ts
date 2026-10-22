import type { Draft } from "@/lib/types/draft";

/**
 * "새 계산": 금액과 불러온 매물 연결을 비우고 LTV 직접 입력을 끈다.
 * 소재지·보유 상태는 사용자의 지속 조건이라 유지한다. 은행 상담 LTV는 그 매물의 값이라
 * 다음 매물에 남으면 과대 표시가 되므로 끈다(ADR-013).
 */
export function toNewCalculationDraft(draft: Draft): Draft {
  return { ...draft, salePrice: "", kbPrice: "", listingId: null, customLtv: null };
}

import { DEFAULT_CUSTOM_LTV } from "@/lib/constants/draft";

import type { Draft } from "@/lib/types/draft";

/**
 * "새 계산": 금액과 불러온 매물 연결을 비우고 LTV는 기본 70%, 85㎡ 초과는 끔으로 되돌린다.
 * 소재지·보유 상태는 사용자의 지속 조건이라 유지한다. 은행 상담 LTV와 면적, 추가 비용 줄은 그 매물의 값이라
 * 다음 매물에 남지 않게 기본값으로 돌린다(ADR-013, ADR-022, ADR-024 U6).
 */
export function toNewCalculationDraft(draft: Draft): Draft {
  return {
    ...draft,
    salePrice: "",
    kbPrice: "",
    listingId: null,
    customLtv: DEFAULT_CUSTOM_LTV,
    isCustomLtvInput: false,
    isAreaOver85: false,
    extraCosts: [],
  };
}

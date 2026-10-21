import { BORROWER_LABELS, REGION_LABELS } from "@/lib/constants/loanConditions";

import type { Borrower, Region } from "@/lib/types/regulation";

/** 결과 카드 상단과 목록 카드가 함께 쓰는 조건 요약. 예: "규제지역 · 무주택·생애최초" */
export function describeCondition(region: Region, borrower: Borrower): string {
  return `${REGION_LABELS[region]} · ${BORROWER_LABELS[borrower]}`;
}

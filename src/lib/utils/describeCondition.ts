import { BORROWER_LABELS, REGION_LABELS } from "@/lib/constants/loanConditions";

import type { Borrower, Region } from "@/lib/types/regulation";

/** 사용자 지정 LTV 표시. 결과 카드·요약 바·조건 요약이 같은 문구를 쓴다. 예: "사용자 지정 LTV 70%" */
export function formatCustomLtv(rate: number): string {
  return `사용자 지정 LTV ${rate}%`;
}

/**
 * 결과 카드 상단과 목록 카드가 함께 쓰는 조건 요약.
 * 예: "규제지역 · 무주택·생애최초", 사용자 지정이면 "규제지역 · 무주택 · 사용자 지정 LTV 70%"
 */
export function describeCondition(
  region: Region,
  borrower: Borrower,
  customLtvRate: number | undefined,
): string {
  const condition = `${REGION_LABELS[region]} · ${BORROWER_LABELS[borrower]}`;
  return typeof customLtvRate === "number"
    ? `${condition} · ${formatCustomLtv(customLtvRate)}`
    : condition;
}

import { formatCustomLtv } from "@/lib/utils/describeCondition";

import type { LoanResult } from "@/lib/types/loan";

/** 사용자 지정이 아닐 때 상태별 태그. 미확인은 1차처럼 태그 없이 "—"만 보인다. */
const STATUS_TAGS: Record<LoanResult["status"], string | null> = {
  ok: null,
  unconfirmed: null,
  ineligible: "요건 미충족",
};

/**
 * 고정 요약 바의 한 줄 태그. 입력부가 길어 결과 카드가 첫 화면 밖에 있을 때
 * 스크롤 없이 지금 계산이 무엇을 전제로 하는지 읽는 곳이다(ADR-013).
 */
export function describeSummaryTag(result: LoanResult | null): string | null {
  if (result === null) return null;
  if (result.appliedLtv?.source === "custom") return formatCustomLtv(result.appliedLtv.rate);
  return STATUS_TAGS[result.status];
}

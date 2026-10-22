import { hasUnconfirmedOwnFunds } from "@/lib/utils/calculateLoan";
import { formatCustomLtv } from "@/lib/utils/describeCondition";

import type { LoanResult } from "@/lib/types/loan";

/** 사용자 지정이 아닐 때 상태별 태그. 미확인은 1차처럼 태그 없이 "—"만 보인다. */
const STATUS_TAGS: Record<LoanResult["status"], string | null> = {
  ok: null,
  unconfirmed: null,
  ineligible: "요건 미충족",
};

const UNCONFIRMED_COST_TAG = "농특세 미확인";

/**
 * 고정 요약 바의 한 줄 태그. 입력부가 길어 결과 카드가 첫 화면 밖에 있을 때
 * 스크롤 없이 지금 계산이 무엇을 전제로 하는지 읽는 곳이다(ADR-013).
 * 자기자금에서 미확인 세금을 뺐으면 그것도 붙인다(ADR-022).
 */
export function describeSummaryTag(result: LoanResult | null): string | null {
  if (result === null) return null;
  const tag =
    result.appliedLtv?.source === "custom"
      ? formatCustomLtv(result.appliedLtv.rate)
      : STATUS_TAGS[result.status];
  if (!hasUnconfirmedOwnFunds(result)) return tag;
  return tag === null ? UNCONFIRMED_COST_TAG : `${tag} · ${UNCONFIRMED_COST_TAG}`;
}

import { formatCustomLtv } from "@/lib/utils/describeCondition";

import styles from "./ResultCard.module.css";

import type { AppliedLtv, LoanResult } from "@/lib/types/loan";

/** 확인된 0%는 미확인·요건 미충족과 구분해 숫자로 보여준다. falsy 검사를 하지 않는다. */
const SOURCE_VALUES: Record<AppliedLtv["source"], (rate: number) => string> = {
  regulation: (rate) => (rate === 0 ? "LTV 0% · 주택구입 목적 주담대 불가" : `${rate}%`),
  custom: formatCustomLtv,
};

/** 계산하지 않은 상태의 배지 */
const NOT_CALCULATED_BADGES: Record<Exclude<LoanResult["status"], "ok">, string> = {
  unconfirmed: "미확인",
  ineligible: "요건 미충족",
};

/** 결과 카드 "적용 LTV" 줄의 값 */
function LtvValue({ result }: { result: LoanResult }) {
  if (result.status !== "ok") {
    return <span className={styles.badge}>{NOT_CALCULATED_BADGES[result.status]}</span>;
  }
  const { source, rate } = result.appliedLtv;
  return <>{SOURCE_VALUES[source](rate)}</>;
}

export default LtvValue;

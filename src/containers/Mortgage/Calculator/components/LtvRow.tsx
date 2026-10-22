import LtvValue from "./LtvValue";
import styles from "./ResultCard.module.css";
import ResultRow from "./ResultRow";

import type { LoanResult, RegulationOutcome } from "@/lib/types/loan";

/** 사용자 지정일 때 함께 보여 줄 규제 기준. 규제로도 계산할 수 없는 상태는 그 이유를 쓴다(ADR-013). */
const NOT_CALCULATED_REGULATIONS: Record<Exclude<RegulationOutcome["status"], "ok">, string> = {
  ineligible: "규제 기준: 서민·실수요자 요건 미충족",
  unconfirmed: "규제 기준 미확인",
};

function describeRegulation(regulation: RegulationOutcome): string {
  return regulation.status === "ok"
    ? `규제 기준 ${regulation.rate}%`
    : NOT_CALCULATED_REGULATIONS[regulation.status];
}

const ABOVE_REGULATION_WARNING =
  "규제 LTV보다 높습니다. 은행 상담 조건(생애최초·정책대출 등)을 확인하세요";

/** "적용 LTV" 줄. 사용자 지정이면 규제 값을 지우지 않고 아래에 나란히 보여 준다. */
function LtvRow({ result }: { result: LoanResult }) {
  const value = <LtvValue result={result} />;
  if (result.status !== "ok" || result.appliedLtv.source !== "custom") {
    return <ResultRow label="적용 LTV" value={value} />;
  }

  const { rate, regulation } = result.appliedLtv;
  const isAboveRegulation = regulation.status === "ok" && rate > regulation.rate;

  return (
    <ResultRow
      label="적용 LTV"
      value={value}
      details={
        <>
          <span className={styles.detailLine}>{describeRegulation(regulation)}</span>
          {result.cap !== null && (
            <span className={styles.detailLine}>한도 상한은 규제대로 적용</span>
          )}
          {isAboveRegulation && <span className={styles.warning}>{ABOVE_REGULATION_WARNING}</span>}
        </>
      }
    />
  );
}

export default LtvRow;

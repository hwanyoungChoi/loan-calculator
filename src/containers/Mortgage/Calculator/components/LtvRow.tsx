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

/** 기본값이 늘 켜져 있어 규제지역에서는 매번 보인다. 한 줄로 짧게 둔다(ADR-022). */
function describeAboveRegulation(regulationRate: number): string {
  return `실제 대출은 규제 기준(${regulationRate}%)으로 나올 수 있습니다`;
}

/** "적용 LTV" 줄. 사용자 지정이면 규제 값을 지우지 않고 아래에 나란히 보여 준다. */
function LtvRow({ result }: { result: LoanResult }) {
  const value = <LtvValue result={result} />;
  if (result.status !== "ok" || result.appliedLtv.source !== "custom") {
    return <ResultRow label="적용 LTV" value={value} />;
  }

  const { rate, regulation } = result.appliedLtv;

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
          {regulation.status === "ok" && rate > regulation.rate && (
            <span className={styles.warning}>{describeAboveRegulation(regulation.rate)}</span>
          )}
        </>
      }
    />
  );
}

export default LtvRow;

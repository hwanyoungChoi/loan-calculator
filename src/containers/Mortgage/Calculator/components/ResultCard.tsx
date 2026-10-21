import { PRICE_SOURCE_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import CapRow from "./CapRow";
import LtvValue from "./LtvValue";
import RegulationBasis from "./RegulationBasis";
import styles from "./ResultCard.module.css";
import ResultRow from "./ResultRow";

import type { LoanInput } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type ResultCardProps = {
  /** 두 금액이 모두 유효할 때만 값이 있다. null이면 빈 상태 */
  input: LoanInput | null;
  /** 테스트에서 미확인 fixture를 끼워 넣을 수 있도록 prop으로 받는다(ADR-008). */
  regulations: Regulations;
};

const UNCONFIRMED_MESSAGE = "이 조건의 LTV는 1차 출처로 확인되지 않아 계산하지 않습니다";

/** 계산 과정을 숨기지 않는다: 담보 기준 → LTV → LTV 금액 → 상한 → 예상 한도 → 자기자금 */
function ResultCard({ input, regulations }: ResultCardProps) {
  if (input === null) {
    return (
      <section className={styles.card} aria-label="계산 결과">
        <p className={styles.empty}>매매가와 KB시세를 입력하세요</p>
      </section>
    );
  }

  const result = calculateLoan(input, regulations);

  return (
    <section className={styles.card} aria-label="계산 결과">
      <h2 className={styles.condition}>{describeCondition(input.region, input.borrower)}</h2>
      <dl className={styles.rows}>
        <ResultRow
          label="담보 기준"
          value={`${formatManwon(result.collateralBase)}(${PRICE_SOURCE_LABELS[result.collateralSource]})`}
          details="매매가와 KB시세 중 낮은 금액"
        />
        <ResultRow label="적용 LTV" value={<LtvValue ltv={result.ltv} />} />
        <ResultRow label="LTV 금액" value={formatManwonOrDash(result.ltvAmount)} />
        <CapRow cap={result.cap} />
        <ResultRow
          label="예상 한도"
          value={formatManwonOrDash(result.loanLimit)}
          variant="emphasis"
        />
        <ResultRow
          label="필요한 자기자금(부대비용 제외)"
          value={formatManwonOrDash(result.ownFunds)}
          variant="emphasis"
        />
      </dl>
      {result.status === "unconfirmed" && (
        <p className={styles.unconfirmed}>{UNCONFIRMED_MESSAGE}</p>
      )}
      <p className={styles.scope}>DSR·소득 심사 미반영, 취득세 등 부대비용 제외</p>
      <RegulationBasis result={result} regulations={regulations} />
    </section>
  );
}

export default ResultCard;

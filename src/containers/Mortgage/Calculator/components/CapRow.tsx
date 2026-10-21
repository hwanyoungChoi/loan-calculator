import { PRICE_SOURCE_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon } from "@/lib/utils/amount";

import styles from "./ResultCard.module.css";
import ResultRow from "./ResultRow";

import type { CapResult } from "@/lib/types/loan";

/** 한도 상한 행. 구간 판단에 쓴 가격과 경계 매물 여부를 함께 보여준다(ADR-005). */
function CapRow({ cap }: { cap: CapResult | null }) {
  if (cap === null) {
    return (
      <ResultRow
        label="한도 상한"
        value="적용 안 함"
        details="이 지역은 한도 상한이 적용되지 않습니다"
      />
    );
  }

  return (
    <ResultRow
      label="한도 상한"
      value={formatManwon(cap.amount)}
      details={
        <>
          <span className={styles.detailLine}>{cap.tierLabel}</span>
          <span className={styles.detailLine}>
            구간 기준 가격: {formatManwon(cap.capReferencePrice)}(
            {PRICE_SOURCE_LABELS[cap.capReferenceSource]})
          </span>
          {cap.isBoundaryCase && (
            <span className={styles.warning}>구간 경계 매물: 은행 확인 필요</span>
          )}
        </>
      }
    />
  );
}

export default CapRow;

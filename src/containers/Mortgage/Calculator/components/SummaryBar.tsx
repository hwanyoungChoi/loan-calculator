import { formatManwonOrDash } from "@/lib/utils/amount";

import styles from "./SummaryBar.module.css";

import type { LoanResult } from "@/lib/types/loan";

type SummaryBarProps = {
  result: LoanResult | null;
};

/** 화면 하단 고정 요약. 키보드가 덮는 것은 허용한다(visualViewport 대응 없음). */
function SummaryBar({ result }: SummaryBarProps) {
  return (
    <div className={styles.bar}>
      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt>예상 한도</dt>
          <dd>{formatManwonOrDash(result?.loanLimit ?? null)}</dd>
        </div>
        <div className={styles.figure}>
          <dt>필요한 자기자금</dt>
          <dd>{formatManwonOrDash(result?.ownFunds ?? null)}</dd>
        </div>
      </dl>
      {/* 저장 기능은 태스크 2-3a에서 연결한다. */}
      <button type="button" className={styles.saveButton} disabled>
        저장
      </button>
    </div>
  );
}

export default SummaryBar;

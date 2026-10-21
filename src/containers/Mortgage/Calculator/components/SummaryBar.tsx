import { formatManwonOrDash } from "@/lib/utils/amount";

import styles from "./SummaryBar.module.css";

import type { SaveButtonState } from "../saveButtonState";
import type { LoanResult } from "@/lib/types/loan";

type SummaryBarProps = {
  result: LoanResult | null;
  save: SaveButtonState;
  onSave: () => void;
};

const SAVE_MESSAGE_ID = "save-unavailable-message";

/** 화면 하단 고정 요약. 키보드가 덮는 것은 허용한다(visualViewport 대응 없음). */
function SummaryBar({ result, save, onSave }: SummaryBarProps) {
  return (
    <div className={styles.bar}>
      {save.message !== null && (
        <p id={SAVE_MESSAGE_ID} className={styles.message}>
          {save.message}
        </p>
      )}
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
      <button
        type="button"
        className={styles.saveButton}
        disabled={save.isDisabled}
        aria-describedby={save.message === null ? undefined : SAVE_MESSAGE_ID}
        onClick={onSave}
      >
        {save.label}
      </button>
    </div>
  );
}

export default SummaryBar;

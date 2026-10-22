import { formatManwonOrDash } from "@/lib/utils/amount";

import styles from "./SummaryBar.module.css";

import type { SaveButtonState } from "../saveButtonState";
import type { LoanResult } from "@/lib/types/loan";
import type { Ref } from "react";

type SummaryBarProps = {
  result: LoanResult | null;
  /** 숫자 아래 한 줄 태그("요건 미충족", "사용자 지정 LTV 70%"). 없으면 null */
  tag: string | null;
  save: SaveButtonState;
  /** 저장 시트를 닫은 뒤 포커스를 돌려줄 자리 */
  saveButtonRef: Ref<HTMLButtonElement>;
  onSave: () => void;
};

const SAVE_MESSAGE_ID = "save-unavailable-message";

/** 화면 하단 고정 요약. 키보드가 덮는 것은 허용한다(visualViewport 대응 없음). */
function SummaryBar({ result, tag, save, saveButtonRef, onSave }: SummaryBarProps) {
  return (
    <section className={styles.bar} aria-label="계산 요약">
      {save.message !== null && (
        <p id={SAVE_MESSAGE_ID} className={styles.message}>
          {save.message}
        </p>
      )}
      <div className={styles.summary}>
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
        {tag !== null && <p className={styles.tag}>{tag}</p>}
      </div>
      <button
        ref={saveButtonRef}
        type="button"
        className={styles.saveButton}
        disabled={save.isDisabled}
        aria-describedby={save.message === null ? undefined : SAVE_MESSAGE_ID}
        onClick={onSave}
      >
        {save.label}
      </button>
    </section>
  );
}

export default SummaryBar;

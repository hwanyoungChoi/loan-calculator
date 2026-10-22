import { useEffect, useState, type FormEvent } from "react";

import AmountInput from "@/components/AmountInput";
import { formatManwon, validateAmount } from "@/lib/utils/amount";

import styles from "./BudgetBar.module.css";

type BudgetBarProps = {
  /** 만원. null이면 예산 없음 */
  budget: number | null;
  overBudgetCount: number;
  onChange: (budget: number | null) => void;
};

const BUDGET_INPUT_ID = "budget";

function amountErrorOf(raw: string): string | null {
  const validation = validateAmount(raw);
  return validation.status === "error" ? validation.message : null;
}

/** 비운 채 저장하면 예산을 지운다. */
function toBudget(raw: string): number | null {
  const validation = validateAmount(raw);
  return validation.status === "valid" ? validation.value : null;
}

type BudgetFormProps = {
  budget: number | null;
  onSubmit: (budget: number | null) => void;
  onCancel: () => void;
};

function BudgetForm({ budget, onSubmit, onCancel }: BudgetFormProps) {
  const [value, setValue] = useState(budget === null ? "" : String(budget));
  const [error, setError] = useState<string | null>(null);
  const isUnchanged = toBudget(value) === budget && amountErrorOf(value) === null;

  useEffect(() => {
    document.getElementById(BUDGET_INPUT_ID)?.focus();
  }, []);

  const handleChange = (raw: string) => {
    setValue(raw);
    if (amountErrorOf(raw) === null) setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextError = amountErrorOf(value);
    if (nextError !== null) {
      setError(nextError);
      document.getElementById(BUDGET_INPUT_ID)?.focus();
      return;
    }
    onSubmit(toBudget(value));
  };

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <AmountInput
        id={BUDGET_INPUT_ID}
        label="내 예산(비우고 저장하면 지움)"
        value={value}
        error={error}
        onChange={handleChange}
        onBlur={() => setError(amountErrorOf(value))}
      />
      <div className={styles.formActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          취소
        </button>
        <button type="submit" className={styles.primaryButton} disabled={isUnchanged}>
          저장
        </button>
      </div>
    </form>
  );
}

/** 저장 목록 위의 내 예산. 예산이 있으면 필요한 자기자금이 예산을 넘는 매물 수를 함께 보인다. */
function BudgetBar({ budget, overBudgetCount, onChange }: BudgetBarProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <section className={styles.bar} aria-label="내 예산">
        <BudgetForm
          budget={budget}
          onSubmit={(next) => {
            onChange(next);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className={styles.bar} aria-label="내 예산">
      <div className={styles.summary}>
        {budget === null ? (
          <p className={styles.empty}>예산을 입력하면 넘는 매물을 표시합니다</p>
        ) : (
          <p>
            내 예산 <strong className={styles.amount}>{formatManwon(budget)}</strong>
          </p>
        )}
        {budget !== null && overBudgetCount > 0 && (
          <p className={styles.overCount}>예산 초과 {overBudgetCount}건</p>
        )}
      </div>
      <button type="button" className={styles.editButton} onClick={() => setIsEditing(true)}>
        {budget === null ? "예산 입력" : "수정"}
      </button>
    </section>
  );
}

export default BudgetBar;

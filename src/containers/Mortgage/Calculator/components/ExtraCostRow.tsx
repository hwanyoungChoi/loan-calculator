import AmountInput from "@/components/AmountInput";
import { EXTRA_COST_CATEGORY_LABELS } from "@/lib/constants/extraCosts";

import styles from "./ExtraCostsSection.module.css";

import type { ExtraCostDraftRow } from "@/lib/types/draft";

/** 줄의 이름 칸·금액 칸 id. 줄 id로 화면 전체에서 유일하게 만들고, 추가·삭제 뒤 포커스를 이 id로 옮긴다. */
export const extraCostLabelInputId = (rowId: string) => `extra-cost-${rowId}-label`;
export const extraCostAmountInputId = (rowId: string) => `extra-cost-${rowId}-amount`;

type ExtraCostRowProps = {
  row: ExtraCostDraftRow;
  /** blur한 뒤(또는 새로고침으로 복원된 줄)에만 보이는 오류. 없으면 null */
  labelError: string | null;
  amountError: string | null;
  onChange: (patch: Partial<Pick<ExtraCostDraftRow, "label" | "amount">>) => void;
  onLabelBlur: () => void;
  onAmountBlur: () => void;
  onDelete: () => void;
};

/** 추가 비용 한 줄: [이름][삭제] / [금액]. 같은 이름이 둘일 수 있어 보조기기 이름에 분류를 붙인다. */
function ExtraCostRow({
  row,
  labelError,
  amountError,
  onChange,
  onLabelBlur,
  onAmountBlur,
  onDelete,
}: ExtraCostRowProps) {
  const categoryLabel = EXTRA_COST_CATEGORY_LABELS[row.category];
  const name = row.label.trim() === "" ? "이름 없는 항목" : row.label.trim();
  const labelInputId = extraCostLabelInputId(row.id);
  const labelErrorId = `${labelInputId}-error`;

  return (
    <li className={styles.row}>
      <div className={styles.labelLine}>
        <input
          id={labelInputId}
          className={styles.labelInput}
          type="text"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="항목 이름"
          aria-label={`${categoryLabel} 항목 이름`}
          value={row.label}
          aria-invalid={labelError !== null}
          aria-describedby={labelError === null ? undefined : labelErrorId}
          onChange={(event) => onChange({ label: event.target.value })}
          onBlur={onLabelBlur}
        />
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`${categoryLabel} ${name} 삭제`}
          onClick={onDelete}
        >
          삭제
        </button>
      </div>
      {labelError !== null && (
        <p id={labelErrorId} className={styles.error}>
          {labelError}
        </p>
      )}
      <AmountInput
        id={extraCostAmountInputId(row.id)}
        label={`${categoryLabel} ${name} 금액`}
        value={row.amount}
        error={amountError}
        isCompact
        onChange={(amount) => onChange({ amount })}
        onBlur={onAmountBlur}
      />
    </li>
  );
}

export default ExtraCostRow;

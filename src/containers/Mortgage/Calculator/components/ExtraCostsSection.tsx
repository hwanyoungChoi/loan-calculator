import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import ChoiceGroup from "@/components/ChoiceGroup";
import {
  EXTRA_COST_CATEGORIES,
  EXTRA_COST_CATEGORY_LABELS,
  EXTRA_COST_MAX_ITEMS,
} from "@/lib/constants/extraCosts";
import { formatManwon } from "@/lib/utils/amount";
import { createRandomId } from "@/lib/utils/createRandomId";
import {
  extraCostAmountError,
  extraCostLabelError,
  groupExtraCosts,
  sumExtraCosts,
  summarizeExtraCostRows,
  toExtraCosts,
} from "@/lib/utils/extraCosts";

import ExtraCostRow, { extraCostAmountInputId, extraCostLabelInputId } from "./ExtraCostRow";
import styles from "./ExtraCostsSection.module.css";
import { EXTRA_COST_PRESETS } from "../extraCostPresets";

import type { ExtraCostDraftRow } from "@/lib/types/draft";
import type { ExtraCostCategory } from "@/lib/types/extraCost";

type ExtraCostsSectionProps = {
  /** draft의 줄(입력 순서) */
  rows: ExtraCostDraftRow[];
  onChange: (rows: ExtraCostDraftRow[]) => void;
};

type RowField = "label" | "amount";

const TITLE_ID = "extra-costs-title";

const CATEGORY_OPTIONS = EXTRA_COST_CATEGORIES.map((value) => ({
  value,
  label: EXTRA_COST_CATEGORY_LABELS[value],
}));

const fieldKey = (rowId: string, field: RowField) => `${rowId}:${field}`;

/** 묶음 머리의 소계. 묶음 안에 확인할 줄이 있으면 "—" */
function describeSubtotal(rows: ExtraCostDraftRow[]): string {
  const extraCosts = toExtraCosts(rows);
  return extraCosts === null ? "—" : formatManwon(sumExtraCosts(extraCosts));
}

/**
 * 계산 화면의 "추가 비용": 분류를 고르고 추천 항목이나 [직접 입력]으로 줄을 더한다(ADR-024).
 * 줄은 draft라 새로고침해도 남는다. 고른 분류는 화면 상태다(다시 열면 인테리어).
 * 오류는 칸을 벗어난 뒤에 보인다. 처음 그릴 때 이미 있던 줄(새로고침·매물 열기)은 처음부터 보인다.
 * 그래야 저장 버튼이 막혔는데 어디가 틀렸는지 안 보이는 일이 없다.
 */
function ExtraCostsSection({ rows, onChange }: ExtraCostsSectionProps) {
  const [category, setCategory] = useState<ExtraCostCategory>("interior");
  const [blurredFields, setBlurredFields] = useState(
    () => new Set(rows.flatMap((row) => [fieldKey(row.id, "label"), fieldKey(row.id, "amount")])),
  );
  const customButtonRef = useRef<HTMLButtonElement>(null);

  const summary = summarizeExtraCostRows(rows);
  const groups = groupExtraCosts(rows);
  // 삭제 뒤 포커스는 화면 순서(분류별 묶음)의 다음 줄로 간다. draft 순서(입력 순서)와 다르다.
  const displayedRows = groups.flatMap((group) => group.items);
  const isFull = rows.length >= EXTRA_COST_MAX_ITEMS;
  const categoryLabel = EXTRA_COST_CATEGORY_LABELS[category];

  const markBlurred = (rowId: string, field: RowField) => {
    setBlurredFields((prev) => new Set(prev).add(fieldKey(rowId, field)));
  };

  const errorOf = (row: ExtraCostDraftRow, field: RowField): string | null => {
    if (!blurredFields.has(fieldKey(row.id, field))) return null;
    return field === "label" ? extraCostLabelError(row.label) : extraCostAmountError(row.amount);
  };

  /** 추천 항목이면 금액 칸으로, [직접 입력]이면 이름 칸으로 간다. 칸이 그려진 뒤여야 한다. */
  const addRow = (label: string) => {
    const row: ExtraCostDraftRow = { id: createRandomId(), category, label, amount: "" };
    flushSync(() => onChange([...rows, row]));
    const inputId = label === "" ? extraCostLabelInputId(row.id) : extraCostAmountInputId(row.id);
    document.getElementById(inputId)?.focus();
  };

  const updateRow = (rowId: string, patch: Partial<ExtraCostDraftRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const deleteRow = (rowId: string) => {
    const nextRow = displayedRows[displayedRows.findIndex((row) => row.id === rowId) + 1] ?? null;
    flushSync(() => onChange(rows.filter((row) => row.id !== rowId)));
    if (nextRow === null) customButtonRef.current?.focus();
    else document.getElementById(extraCostLabelInputId(nextRow.id))?.focus();
  };

  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 id={TITLE_ID} className={styles.title}>
            추가 비용
          </h2>
          <p className={styles.description}>인테리어·가전·가구·이사처럼 집값 말고 드는 돈</p>
        </div>
        {summary.status === "valid" && (
          <p className={styles.total}>
            {formatManwon(summary.total)} · {summary.count}개
          </p>
        )}
        {summary.status === "invalid" && (
          <p className={styles.total}>
            —<span className={styles.totalNote}>확인할 항목이 있습니다</span>
          </p>
        )}
      </div>
      <ChoiceGroup
        name="extraCostCategory"
        legend="분류"
        options={CATEGORY_OPTIONS}
        value={category}
        columns={3}
        onChange={setCategory}
      />
      <div className={styles.chips} role="group" aria-label={`${categoryLabel} 추천 항목 추가`}>
        {EXTRA_COST_PRESETS[category].map((label) => (
          <button
            key={label}
            type="button"
            className={styles.chip}
            disabled={isFull}
            onClick={() => addRow(label)}
          >
            {label}
          </button>
        ))}
        <button
          ref={customButtonRef}
          type="button"
          className={styles.customChip}
          disabled={isFull}
          onClick={() => addRow("")}
        >
          직접 입력
        </button>
      </div>
      {isFull && (
        <p className={styles.notice}>최대 {EXTRA_COST_MAX_ITEMS}개까지 적을 수 있습니다</p>
      )}
      {groups.map((group) => (
        <div key={group.category} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {EXTRA_COST_CATEGORY_LABELS[group.category]} · {describeSubtotal(group.items)}
          </h3>
          <ul className={styles.rows}>
            {group.items.map((row) => (
              <ExtraCostRow
                key={row.id}
                row={row}
                labelError={errorOf(row, "label")}
                amountError={errorOf(row, "amount")}
                onChange={(patch) => updateRow(row.id, patch)}
                onLabelBlur={() => markBlurred(row.id, "label")}
                onAmountBlur={() => markBlurred(row.id, "amount")}
                onDelete={() => deleteRow(row.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default ExtraCostsSection;

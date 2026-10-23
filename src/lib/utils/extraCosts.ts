import { EXTRA_COST_CATEGORIES } from "@/lib/constants/extraCosts";

import { validateAmount } from "./amount";
import { validateExtraCostLabel } from "./validateListingFields";

import type { ExtraCostDraftRow } from "@/lib/types/draft";
import type { ExtraCost, ExtraCostCategory } from "@/lib/types/extraCost";

/** 추가 비용은 금액을 모르는 줄을 두지 않는다(스펙 U8). 매매가 칸과 달리 빈 칸도 오류다. */
const EMPTY_AMOUNT_MESSAGE = "금액을 입력하세요";

/** 줄 이름 칸의 오류 문구. 규칙은 서버와 같은 `validateExtraCostLabel` 하나다. */
export function extraCostLabelError(raw: string): string | null {
  const validation = validateExtraCostLabel(raw);
  return validation.ok ? null : validation.message;
}

/** 줄 금액 칸의 오류 문구. 범위·형식은 매매가와 같은 `validateAmount`다. */
export function extraCostAmountError(raw: string): string | null {
  const validation = validateAmount(raw);
  if (validation.status === "empty") return EMPTY_AMOUNT_MESSAGE;
  return validation.status === "error" ? validation.message : null;
}

/**
 * 입력 중인 줄 → 저장 값(입력 순서, 이름은 앞뒤 공백을 걷는다). 한 줄이라도 틀리면 null("확인 필요").
 * 줄이 없으면 빈 배열이고, 저장할 때 키를 쓰지 않는 것은 `toListingFields`가 맡는다.
 */
export function toExtraCosts(rows: ExtraCostDraftRow[]): ExtraCost[] | null {
  const extraCosts: ExtraCost[] = [];
  for (const row of rows) {
    const label = validateExtraCostLabel(row.label);
    const amount = validateAmount(row.amount);
    if (!label.ok || amount.status !== "valid") return null;
    extraCosts.push({ category: row.category, label: label.label, amount: amount.value });
  }
  return extraCosts;
}

/** 합계(만원). 없으면 0. 최대 30 × 999,999,999라 안전 정수 범위다. */
export function sumExtraCosts(extraCosts: ExtraCost[] = []): number {
  return extraCosts.reduce((total, extraCost) => total + extraCost.amount, 0);
}

/** 총 필요 금액 = 필요한 자기자금 + 추가 비용. 자기자금을 계산하지 못했으면(null) 총도 null("—")이다. */
export function totalRequired(ownFunds: number | null, extraTotal: number): number | null {
  return ownFunds === null ? null : ownFunds + extraTotal;
}

export type ExtraCostGroup<T> = { category: ExtraCostCategory; items: T[] };

/** 분류 순서대로 묶고, 분류 안은 입력 순서를 지킨다. 줄이 없는 분류는 빠진다. */
export function groupExtraCosts<T extends { category: ExtraCostCategory }>(
  items: T[],
): ExtraCostGroup<T>[] {
  return EXTRA_COST_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

/** 계산 화면의 추가 비용 상태: 줄 없음 / 모두 유효(합계·개수) / 확인할 줄이 있음 */
export type ExtraCostSummary =
  | { status: "none" }
  | { status: "valid"; total: number; count: number }
  | { status: "invalid"; count: number };

export function summarizeExtraCostRows(rows: ExtraCostDraftRow[]): ExtraCostSummary {
  if (rows.length === 0) return { status: "none" };
  const extraCosts = toExtraCosts(rows);
  if (extraCosts === null) return { status: "invalid", count: rows.length };
  return { status: "valid", total: sumExtraCosts(extraCosts), count: rows.length };
}

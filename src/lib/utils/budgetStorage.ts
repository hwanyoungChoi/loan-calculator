import { isBudgetAmount } from "./isBudgetAmount";

import type { BudgetStore } from "@/lib/types/budget";

export const BUDGET_STORAGE_KEY = "loan-calculator/budget";

/** 저장소 원문 → 예산. 키 없음·JSON 아님·1~최대 금액 정수가 아니면 예산 없음(null)으로 조용히 본다. */
export function parseBudget(raw: string | null): number | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  return isBudgetAmount(value) ? value : null;
}

function loadBudget(storage: Storage): number | null {
  try {
    return parseBudget(storage.getItem(BUDGET_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** 저장 매물과 다른 키에 둔다. 메모리 상태가 원본이고 storage에는 최선으로 기록한다(접근 불가면 메모리로만 동작). */
export function createBudgetStore({ storage }: { storage: Storage }): BudgetStore {
  const listeners = new Set<() => void>();
  let budget = loadBudget(storage);

  return {
    getSnapshot: () => budget,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      budget = next;
      try {
        if (next === null) storage.removeItem(BUDGET_STORAGE_KEY);
        else storage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 접근 불가: 이 탭에서만 유지한다.
      }
      for (const listener of listeners) listener();
    },
  };
}

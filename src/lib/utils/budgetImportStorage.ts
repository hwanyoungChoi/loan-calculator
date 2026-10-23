import type { BudgetImportStore } from "@/lib/types/budget";

/** 새 키(기존 `loan-calculator/budget`은 읽기만 하고 건드리지 않는다, AC-0) */
export const BUDGET_IMPORTS_STORAGE_KEY = "loan-calculator/budget-imports";

/** 원문 → 기록. 키 없음·JSON 아님·문자열 배열이 아니면 빈 기록이다. */
export function parseBudgetImports(rawText: string | null): string[] {
  if (rawText === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(rawText);
  } catch {
    return [];
  }
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

/**
 * 키 `loan-calculator/budget-imports`. 기록은 최선으로 한다.
 * 못 쓰면 다음에 다시 올리지만, 서버가 계정 값이 있으면 덮지 않는다(COALESCE).
 */
export function createBudgetImportStore({ storage }: { storage: Storage }): BudgetImportStore {
  function read(): string[] {
    try {
      return parseBudgetImports(storage.getItem(BUDGET_IMPORTS_STORAGE_KEY));
    } catch {
      return [];
    }
  }

  return {
    has: (userId) => read().includes(userId),
    add(userId) {
      const userIds = read();
      if (userIds.includes(userId)) return;
      try {
        storage.setItem(BUDGET_IMPORTS_STORAGE_KEY, JSON.stringify([...userIds, userId]));
      } catch {
        // 접근 불가·용량 초과
      }
    },
  };
}

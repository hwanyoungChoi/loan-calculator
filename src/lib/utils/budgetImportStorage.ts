import { createUserIdRecordStore } from "./userIdRecordStorage";

import type { BudgetImportStore } from "@/lib/types/budget";

/** 새 키(기존 `loan-calculator/budget`은 읽기만 하고 건드리지 않는다, AC-0) */
export const BUDGET_IMPORTS_STORAGE_KEY = "loan-calculator/budget-imports";

/** 키 `loan-calculator/budget-imports` */
export function createBudgetImportStore({ storage }: { storage: Storage }): BudgetImportStore {
  return createUserIdRecordStore({ storage, key: BUDGET_IMPORTS_STORAGE_KEY });
}

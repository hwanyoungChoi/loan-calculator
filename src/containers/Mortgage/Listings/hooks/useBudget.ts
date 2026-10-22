import { useSyncExternalStore } from "react";

import type { BudgetStore } from "@/lib/types/budget";

/** 내 예산(만원)을 구독한다. 없으면 null. 바꾸기는 `store.set`으로 한다. */
export function useBudget(store: BudgetStore): number | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

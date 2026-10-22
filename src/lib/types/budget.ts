/** 내 예산(만원). null이면 예산 없음. */
export type BudgetStore = {
  getSnapshot: () => number | null;
  subscribe: (listener: () => void) => () => void;
  set: (budget: number | null) => void;
};

import type { UserIdRecordStore } from "./storage";

/** 내 예산(만원). null이면 예산 없음. */
export type BudgetStore = {
  getSnapshot: () => number | null;
  subscribe: (listener: () => void) => () => void;
  set: (budget: number | null) => void;
};

/** `loan-calculator/budget-imports`: 이 기기의 예산 이전을 끝낸(또는 올릴 예산이 없던) 사용자 id */
export type BudgetImportStore = UserIdRecordStore;

/**
 * 예산 줄이 그리는 예산. 출처가 정해지기 전(loading), 계정 확인 실패(accountError),
 * 로그인 상태의 첫 조회·이전 실패(loadFailed)에는 기기 예산으로 대신 보이지 않는다.
 */
export type BudgetState =
  | { status: "loading" }
  | { status: "accountError" }
  | { status: "loadFailed" }
  | { status: "ok"; budget: number | null };

/** 예산 저장 실패. notReady: 출처가 정해지지 않음, unauthorized: 401, network: 연결·서버 오류 */
export type BudgetSaveFailure = { ok: false; reason: "notReady" | "unauthorized" | "network" };

export type BudgetSaveResult = { ok: true } | BudgetSaveFailure;

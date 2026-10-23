import type { UserIdRecordStore } from "./storage";

/** 직접 정렬 순서(매물 id, ADR-026). null이면 순서 없음. 로그아웃 상태의 원본 */
export type ListingOrderStore = {
  getSnapshot: () => string[] | null;
  subscribe: (listener: () => void) => () => void;
  set: (ids: string[]) => void;
};

/** `loan-calculator/listing-order-imports`: 이 기기의 순서 이전을 끝낸(또는 올릴 순서가 없던) 사용자 id */
export type ListingOrderImportStore = UserIdRecordStore;

/**
 * 목록이 쓰는 순서. 출처가 정해지기 전(loading), 계정 확인 실패(accountError),
 * 로그인 상태의 첫 조회·이전 실패(loadFailed)에는 기기 순서로 대신 쓰지 않는다.
 */
export type ListingOrderState =
  | { status: "loading" }
  | { status: "accountError" }
  | { status: "loadFailed" }
  | { status: "ok"; ids: string[] | null };

/** 순서 저장 실패. notReady: 출처가 정해지지 않음, unauthorized: 401, network: 연결·서버 오류 */
export type ListingOrderSaveFailure = {
  ok: false;
  reason: "notReady" | "unauthorized" | "network";
};

export type ListingOrderSaveResult = { ok: true } | ListingOrderSaveFailure;

// 시그니처 스텁(태스크 1-1). 구현은 태스크 2-1.
import type { Draft, DraftStore } from "@/lib/types/draft";
import type { StorageWriteResult } from "@/lib/types/storage";

/** 손상·키 없음은 기본 draft. throw하지 않는다. */
export const parseDraft: (raw: unknown) => Draft = () => {
  throw new Error("미구현: 태스크 2-1");
};

/** 키 `loan-calculator/draft`. 접근 불가도 기본 draft */
export const loadDraft: (storage: Storage) => Draft = () => {
  throw new Error("미구현: 태스크 2-1");
};

export const saveDraft: (storage: Storage, draft: Draft) => StorageWriteResult = () => {
  throw new Error("미구현: 태스크 2-1");
};

export const createDraftStore: (options: { storage: Storage }) => DraftStore = () => {
  throw new Error("미구현: 태스크 2-1");
};

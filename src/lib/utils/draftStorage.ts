import { DEFAULT_DRAFT } from "@/lib/constants/draft";
import { BORROWERS, REGIONS } from "@/lib/constants/loanConditions";

import { isOneOf } from "./isOneOf";

import type { Draft, DraftStore } from "@/lib/types/draft";
import type { StorageWriteResult } from "@/lib/types/storage";

export const DRAFT_STORAGE_KEY = "loan-calculator/draft";

/**
 * 저장소 원문(`getItem` 결과) → draft. 키 없음·JSON 아님·스키마 불일치는 모두 기본 draft다.
 * 작성 중 임시 값이라 잃어도 괜찮으므로 throw하지 않고 조용히 기본값으로 시작한다.
 */
export function parseDraft(raw: unknown): Draft {
  if (typeof raw !== "string") return DEFAULT_DRAFT;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_DRAFT;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return DEFAULT_DRAFT;
  const { salePrice, kbPrice, region, borrower, listingId } = value as Record<string, unknown>;
  const isValid =
    typeof salePrice === "string" &&
    typeof kbPrice === "string" &&
    isOneOf(REGIONS, region) &&
    isOneOf(BORROWERS, borrower) &&
    (listingId === null || (typeof listingId === "string" && listingId !== ""));
  if (!isValid) return DEFAULT_DRAFT;
  return { salePrice, kbPrice, region, borrower, listingId };
}

/** 키 `loan-calculator/draft`. 접근 불가도 기본 draft */
export function loadDraft(storage: Storage): Draft {
  try {
    return parseDraft(storage.getItem(DRAFT_STORAGE_KEY));
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function saveDraft(storage: Storage, draft: Draft): StorageWriteResult {
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** 메모리 상태가 원본이고, 바뀔 때마다 storage에 최선으로 기록한다(접근 불가면 메모리로만 동작). */
export function createDraftStore({ storage }: { storage: Storage }): DraftStore {
  const listeners = new Set<() => void>();
  let draft = loadDraft(storage);

  function replace(next: Draft) {
    draft = next;
    saveDraft(storage, draft);
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => draft,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (patch) => replace({ ...draft, ...patch }),
    clear: () => replace(DEFAULT_DRAFT),
  };
}

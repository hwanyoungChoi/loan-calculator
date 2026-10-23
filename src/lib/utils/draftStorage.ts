import { DEFAULT_DRAFT } from "@/lib/constants/draft";
import { EXTRA_COST_CATEGORIES, EXTRA_COST_MAX_ITEMS } from "@/lib/constants/extraCosts";
import { BORROWERS, REGIONS } from "@/lib/constants/loanConditions";

import { isOneOf } from "./isOneOf";

import type { Draft, DraftStore, ExtraCostDraftRow } from "@/lib/types/draft";
import type { StorageWriteResult } from "@/lib/types/storage";

export const DRAFT_STORAGE_KEY = "loan-calculator/draft";

function isExtraCostDraftRow(value: unknown): value is ExtraCostDraftRow {
  if (typeof value !== "object" || value === null) return false;
  const { id, category, label, amount } = value as Record<string, unknown>;
  return (
    typeof id === "string" &&
    id !== "" &&
    isOneOf(EXTRA_COST_CATEGORIES, category) &&
    typeof label === "string" &&
    typeof amount === "string"
  );
}

/**
 * draft의 추가 비용 줄. 모양(id·분류·문자열 두 칸)만 보고 내용(길이·금액 범위)은 보지 않는다. 틀린 값도 그대로 보여야 고친다.
 * 키가 없거나(이 기능 전의 draft) 모양이 틀리면 빈 목록이다. 줄 id가 겹치면 포커스·key가 엉키므로 모양이 틀린 것으로 본다.
 */
function parseExtraCostRows(value: unknown): ExtraCostDraftRow[] {
  if (!Array.isArray(value) || !value.every(isExtraCostDraftRow)) return [];
  const rows = value.slice(0, EXTRA_COST_MAX_ITEMS);
  const ids = new Set(rows.map((row) => row.id));
  if (ids.size !== rows.length) return [];
  return rows.map(({ id, category, label, amount }) => ({ id, category, label, amount }));
}

/**
 * 저장소 원문(`getItem` 결과) → draft. 키 없음·JSON 아님·스키마 불일치는 모두 기본 draft다.
 * 작성 중 임시 값이라 잃어도 괜찮으므로 throw하지 않고 조용히 기본값으로 시작한다.
 * 단, 추가 비용(`extraCosts`)만은 관대하게 읽는다: 없거나 틀려도 빈 목록으로 보고 나머지 값을 살린다.
 * 이 키가 생기기 전에 저장된 작성 중 입력이 기본값으로 지워지지 않게 하기 위해서다(ADR-024, AC-0).
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
  const fields = value as Record<string, unknown>;
  const {
    salePrice,
    kbPrice,
    region,
    borrower,
    listingId,
    customLtv,
    isCustomLtvInput,
    isAreaOver85,
  } = fields;
  const isValid =
    typeof salePrice === "string" &&
    typeof kbPrice === "string" &&
    isOneOf(REGIONS, region) &&
    isOneOf(BORROWERS, borrower) &&
    (listingId === null || (typeof listingId === "string" && listingId !== "")) &&
    (customLtv === null || typeof customLtv === "string") &&
    typeof isCustomLtvInput === "boolean" &&
    typeof isAreaOver85 === "boolean";
  if (!isValid) return DEFAULT_DRAFT;
  return {
    salePrice,
    kbPrice,
    region,
    borrower,
    listingId,
    customLtv,
    isCustomLtvInput,
    isAreaOver85,
    extraCosts: parseExtraCostRows(fields.extraCosts),
  };
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

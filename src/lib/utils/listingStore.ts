import { LISTINGS_STORAGE_KEY, parseListings, saveListings } from "./listingStorage";

import type {
  Listing,
  ListingInput,
  ListingSnapshot,
  ListingStore,
  ListingWriteFailure,
  ListingWriteResult,
  LoadListingsResult,
} from "@/lib/types/listing";

export type ListingStoreOptions = {
  storage: Storage;
  /** 비어 있지 않은 문자열 */
  createId: () => string;
  /** ISO 8601 */
  now: () => string;
};

const UNAVAILABLE_SNAPSHOT: ListingSnapshot = { status: "unavailable" };

function toSnapshot(result: LoadListingsResult): ListingSnapshot {
  if (result.ok) return { status: "ok", listings: result.listings };
  if (result.reason === "corrupt") return { status: "corrupt", rawText: result.rawText };
  return UNAVAILABLE_SNAPSHOT;
}

/**
 * 호출 쪽 객체에 다른 키가 섞여 있어도 저장 필드만 옮긴다.
 * 규제 LTV면 `customLtvRate` 키를, 85㎡ 이하면 `isAreaOver85` 키를, 메모가 비면 `memo` 키를 쓰지 않는다.
 * 덮어쓰기도 이전 값을 펼치지 않으므로 키가 남지 않는다(ADR-012, ADR-022). 메모만 `update`가 따로 이어 준다.
 */
export function toListingFields({
  name,
  salePrice,
  kbPrice,
  region,
  borrower,
  customLtvRate,
  isAreaOver85,
  memo,
}: ListingInput): ListingInput {
  return {
    name,
    salePrice,
    kbPrice,
    region,
    borrower,
    ...(typeof customLtvRate === "number" && { customLtvRate }),
    ...(isAreaOver85 === true && { isAreaOver85 }),
    ...(typeof memo === "string" && memo !== "" && { memo }),
  };
}

/**
 * 저장 매물 스토어. 원본은 storage이고, 스냅샷은 원문 문자열이 같으면 같은 참조를 돌려준다.
 * 스냅샷이 ok가 아니면(corrupt/unavailable) reset을 뺀 쓰기는 storage를 건드리지 않고 실패한다(ADR-001).
 */
export function createListingStore({ storage, createId, now }: ListingStoreOptions): ListingStore {
  const listeners = new Set<() => void>();
  let cache: { rawText: string | null; snapshot: ListingSnapshot } | null = null;

  function getSnapshot(): ListingSnapshot {
    let rawText: string | null;
    try {
      rawText = storage.getItem(LISTINGS_STORAGE_KEY);
    } catch {
      return UNAVAILABLE_SNAPSHOT;
    }
    if (cache !== null && cache.rawText === rawText) return cache.snapshot;
    cache = { rawText, snapshot: toSnapshot(parseListings(rawText)) };
    return cache.snapshot;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  function readWritableListings(): { ok: true; listings: Listing[] } | ListingWriteFailure {
    const snapshot = getSnapshot();
    if (snapshot.status !== "ok") return { ok: false, reason: snapshot.status };
    return { ok: true, listings: snapshot.listings };
  }

  /** setItem이 실패하면 storage가 그대로이므로 스냅샷(메모리 상태)도 바뀌지 않는다. */
  function commit(listings: Listing[]): ListingWriteResult {
    const result = saveListings(storage, listings);
    if (result.ok) notify();
    return result;
  }

  return {
    getSnapshot,
    subscribe,
    notify,

    add(input) {
      const current = readWritableListings();
      if (!current.ok) return current;
      const timestamp = now();
      const listing: Listing = {
        id: createId(),
        ...toListingFields(input),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const result = commit([...current.listings, listing]);
      return result.ok ? { ok: true, listing } : result;
    },

    addMany(inputs) {
      const current = readWritableListings();
      if (!current.ok) return current;
      const timestamp = now();
      const added: Listing[] = inputs.map((input) => ({
        id: createId(),
        ...toListingFields(input),
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
      // 한 번에 쓴다. 중간에 실패해 일부만 들어가면 다시 시도할 때 두 벌이 된다.
      const result = commit([...current.listings, ...added]);
      return result.ok ? { ok: true, listings: added } : result;
    },

    update(id, input) {
      const current = readWritableListings();
      if (!current.ok) return current;
      const index = current.listings.findIndex((listing) => listing.id === id);
      if (index === -1) return { ok: false, reason: "notFound" };
      const { createdAt, memo } = current.listings[index];
      // 계산 화면의 덮어쓰기는 memo 키를 넘기지 않으므로 기존 메모를 둔다. 메모 편집만 memo 키를 넘긴다.
      const fields = toListingFields(Object.hasOwn(input, "memo") ? input : { ...input, memo });
      const updated: Listing = { id, ...fields, createdAt, updatedAt: now() };
      return commit(current.listings.with(index, updated));
    },

    remove(id) {
      const current = readWritableListings();
      if (!current.ok) return current;
      if (!current.listings.some((listing) => listing.id === id)) {
        return { ok: false, reason: "notFound" };
      }
      return commit(current.listings.filter((listing) => listing.id !== id));
    },

    reset() {
      try {
        storage.removeItem(LISTINGS_STORAGE_KEY);
      } catch {
        return { ok: false, reason: "unavailable" };
      }
      notify();
      return { ok: true };
    },
  };
}

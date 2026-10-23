import { isListingOrder } from "./isListingOrder";

import type { ListingOrderStore } from "@/lib/types/listingOrder";

/** 새 키(기존 `loan-calculator/listings`는 건드리지 않는다, AC-0) */
export const LISTING_ORDER_STORAGE_KEY = "loan-calculator/listing-order";

/** 저장소 원문 → 순서. 키 없음·JSON 아님·순서 규칙(`isListingOrder`)에 어긋나면 순서 없음(null)으로 조용히 본다. */
export function parseListingOrder(raw: string | null): string[] | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  return isListingOrder(value) ? value : null;
}

function loadListingOrder(storage: Storage): string[] | null {
  try {
    return parseListingOrder(storage.getItem(LISTING_ORDER_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** 메모리 상태가 원본이고 storage에는 최선으로 기록한다(접근 불가면 이 탭에서만 유지). */
export function createListingOrderStore({ storage }: { storage: Storage }): ListingOrderStore {
  const listeners = new Set<() => void>();
  let ids = loadListingOrder(storage);

  return {
    getSnapshot: () => ids,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      ids = next;
      try {
        storage.setItem(LISTING_ORDER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 접근 불가·용량 초과: 이 탭에서만 유지한다.
      }
      for (const listener of listeners) listener();
    },
  };
}

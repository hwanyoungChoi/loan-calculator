import { useEffect, useSyncExternalStore } from "react";

import { LISTINGS_STORAGE_KEY } from "@/lib/utils/listingStorage";

import type { ListingSnapshot, ListingStore } from "@/lib/types/listing";

/** 저장 매물 스냅샷을 구독한다. 다른 탭에서 목록이 바뀌면(`storage` 이벤트) 다시 읽는다. */
export function useListings(store: ListingStore): ListingSnapshot {
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      // key가 null이면 다른 탭에서 storage.clear()를 부른 경우다.
      if (event.key === LISTINGS_STORAGE_KEY || event.key === null) store.notify();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [store]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

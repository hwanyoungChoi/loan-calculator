import { useEffect, useSyncExternalStore } from "react";

import { resolveListingsView } from "../resolveListingsView";

import type { ListingsViewState, ListingsViewStore } from "@/lib/types/listingsView";

/**
 * 주소의 값과 기억으로 정렬·방향·보기를 정하고, 정한 값을 기억에 쓴다.
 * 그래서 값 없는 주소(탭, 로그인 복귀, 공유 추가 뒤)로 들어오면 마지막으로 보여 준 상태가 된다.
 */
export function useListingsView(
  store: ListingsViewStore,
  address: Partial<ListingsViewState>,
): ListingsViewState {
  const remembered = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { sort, order, view } = resolveListingsView(address, remembered);

  useEffect(() => {
    store.set({ sort, order, view });
  }, [store, sort, order, view]);

  return { sort, order, view };
}

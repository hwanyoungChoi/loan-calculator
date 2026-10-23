import { DEFAULT_SORT_ORDER } from "@/lib/constants/listingsView";

import type { ListingsViewState } from "@/lib/types/listingsView";

/**
 * 화면 상태 결정 규칙(ADR-025 D2). 주소에 있는 값이 이기고, 없는 값은 기억(없으면 기본값)으로 채운다.
 * 방향만 주소에 없으면: 주소에 정렬이 있으면 그 정렬의 기본 방향(옛 `?sort=name`은 가→하), 정렬도 없으면 기억된 방향.
 */
export function resolveListingsView(
  address: Partial<ListingsViewState>,
  remembered: ListingsViewState,
): ListingsViewState {
  const rememberedOrFromSort =
    address.sort === undefined ? remembered.order : DEFAULT_SORT_ORDER[address.sort];
  return {
    sort: address.sort ?? remembered.sort,
    order: address.order ?? rememberedOrFromSort,
    view: address.view ?? remembered.view,
  };
}

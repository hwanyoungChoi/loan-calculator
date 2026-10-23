import type { ListingSort, ListingSortOrder, ListingView } from "./listing";

/** 저장 목록이 보여 주는 정렬·방향·보기 */
export type ListingsViewState = { sort: ListingSort; order: ListingSortOrder; view: ListingView };

/** 마지막으로 보여 준 정렬·방향·보기(이 기기). */
export type ListingsViewStore = {
  getSnapshot: () => ListingsViewState;
  subscribe: (listener: () => void) => () => void;
  set: (state: ListingsViewState) => void;
};

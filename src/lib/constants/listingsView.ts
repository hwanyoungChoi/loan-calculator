import type { ListingSort, ListingSortOrder, ListingView } from "@/lib/types/listing";
import type { ListingsViewState } from "@/lib/types/listingsView";

/** 주소·기억에서 읽을 때의 허용 목록 */
export const LISTING_SORTS: ListingSort[] = ["ownFunds", "recent", "name"];
export const LISTING_SORT_ORDERS: ListingSortOrder[] = ["asc", "desc"];
export const LISTING_VIEWS: ListingView[] = ["card", "compact"];

/**
 * 정렬을 처음 고를 때의 방향. 모두 방향 전환 전의 동작 그대로다(스펙 U1):
 * 자기자금 적은 순, 최근 저장 최신 먼저, 가나다 가→하.
 */
export const DEFAULT_SORT_ORDER: Record<ListingSort, ListingSortOrder> = {
  ownFunds: "asc",
  recent: "desc",
  name: "asc",
};

export const OPPOSITE_SORT_ORDER: Record<ListingSortOrder, ListingSortOrder> = {
  asc: "desc",
  desc: "asc",
};

/** 주소에도 기억에도 없을 때: 자기자금순·적은 순·상세히 */
export const DEFAULT_LISTINGS_VIEW: ListingsViewState = {
  sort: "ownFunds",
  order: DEFAULT_SORT_ORDER.ownFunds,
  view: "card",
};

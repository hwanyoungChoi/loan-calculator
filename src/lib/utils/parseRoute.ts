import { PATHS } from "@/lib/constants/paths";

import { isOneOf } from "./isOneOf";

import type { ListingSort, ListingView } from "@/lib/types/listing";
import type { Route } from "@/lib/types/route";

const LISTING_SORTS: ListingSort[] = ["ownFunds", "recent", "name"];
const LISTING_VIEWS: ListingView[] = ["card", "compact"];

/** 해시 → 라우트. 알 수 없는 해시는 계산 화면, 잘못된 정렬·보기 값은 기본(자기자금순, 카드)이다. */
export function parseRoute(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?", 2);
  if (path === "/listings") {
    const params = new URLSearchParams(query);
    const sort = params.get("sort");
    const view = params.get("view");
    return {
      name: "listings",
      sort: isOneOf(LISTING_SORTS, sort) ? sort : "ownFunds",
      view: isOneOf(LISTING_VIEWS, view) ? view : "card",
    };
  }
  return { name: "calculator" };
}

/** 라우트의 정규 경로. 주소가 이것과 다르면 `useHashRoute`가 이 경로로 replace한다. */
export function toRoutePath(route: Route): string {
  return route.name === "listings" ? PATHS.listings(route.sort, route.view) : PATHS.calculator;
}

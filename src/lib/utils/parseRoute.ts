import { PATHS } from "@/lib/constants/paths";

import { isOneOf } from "./isOneOf";

import type { ListingSort } from "@/lib/types/listing";
import type { Route } from "@/lib/types/route";

const LISTING_SORTS: ListingSort[] = ["ownFunds", "recent"];

/** 해시 → 라우트. 알 수 없는 해시는 계산 화면, 잘못된 정렬 값은 기본 정렬이다. */
export function parseRoute(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?", 2);
  if (path === "/listings") {
    const sort = new URLSearchParams(query).get("sort");
    return { name: "listings", sort: isOneOf(LISTING_SORTS, sort) ? sort : "ownFunds" };
  }
  return { name: "calculator" };
}

/** 라우트의 정규 경로. 주소가 이것과 다르면 `useHashRoute`가 이 경로로 replace한다. */
export function toRoutePath(route: Route): string {
  return route.name === "listings" ? PATHS.listings(route.sort) : PATHS.calculator;
}

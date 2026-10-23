import { PATHS } from "@/lib/constants/paths";

import { isOneOf } from "./isOneOf";

import type { ListingSort, ListingView } from "@/lib/types/listing";
import type { LoginResult, Route } from "@/lib/types/route";

const LISTING_SORTS: ListingSort[] = ["ownFunds", "recent", "name"];
const LISTING_VIEWS: ListingView[] = ["card", "compact"];
const LOGIN_RESULTS: LoginResult[] = ["cancelled", "failed", "notConfigured"];

const SHARE_PATH_PREFIX = "/share/";

/**
 * 해시 → 라우트. 알 수 없는 해시는 계산 화면, 잘못된 정렬·보기 값은 기본(자기자금순, 카드)이다.
 * 로그인 결과(`login`)는 허용 목록 밖의 값이면 버린다.
 * `/share/` 뒤는 모양이 틀려도 공유 라우트로 둔다. 화면이 "끊긴 링크"로 안내한다(계산 화면으로 돌리지 않는다).
 */
export function parseRoute(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?", 2);
  if (path.startsWith(SHARE_PATH_PREFIX)) {
    return { name: "share", token: path.slice(SHARE_PATH_PREFIX.length) };
  }
  if (path === "/listings") {
    const params = new URLSearchParams(query);
    const sort = params.get("sort");
    const view = params.get("view");
    const login = params.get("login");
    return {
      name: "listings",
      sort: isOneOf(LISTING_SORTS, sort) ? sort : "ownFunds",
      view: isOneOf(LISTING_VIEWS, view) ? view : "card",
      ...(isOneOf(LOGIN_RESULTS, login) && { login }),
    };
  }
  return { name: "calculator" };
}

/** 라우트의 정규 경로. 주소가 이것과 다르면 `useHashRoute`가 이 경로로 replace한다. */
export function toRoutePath(route: Route): string {
  if (route.name === "share") return PATHS.share(route.token);
  return route.name === "listings"
    ? PATHS.listings(route.sort, route.view, route.login)
    : PATHS.calculator;
}

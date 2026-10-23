import { LISTING_SORT_ORDERS, LISTING_SORTS, LISTING_VIEWS } from "@/lib/constants/listingsView";
import { PATHS } from "@/lib/constants/paths";

import { isOneOf } from "./isOneOf";

import type { LoginResult, Route } from "@/lib/types/route";

const LOGIN_RESULTS: LoginResult[] = ["cancelled", "failed", "notConfigured"];

const SHARE_PATH_PREFIX = "/share/";

/**
 * 해시 → 라우트. 알 수 없는 해시는 계산 화면이다.
 * 정렬·방향·보기와 로그인 결과(`login`)는 없거나 허용 목록 밖의 값이면 버린다(값 없음 → 화면이 기억·기본값으로 채운다).
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
    const order = params.get("order");
    const view = params.get("view");
    const login = params.get("login");
    return {
      name: "listings",
      ...(isOneOf(LISTING_SORTS, sort) && { sort }),
      ...(isOneOf(LISTING_SORT_ORDERS, order) && { order }),
      ...(isOneOf(LISTING_VIEWS, view) && { view }),
      ...(isOneOf(LOGIN_RESULTS, login) && { login }),
    };
  }
  return { name: "calculator" };
}

/** 라우트의 정규 경로. 주소가 이것과 다르면 `useHashRoute`가 이 경로로 replace한다. */
export function toRoutePath(route: Route): string {
  if (route.name === "share") return PATHS.share(route.token);
  return route.name === "listings" ? PATHS.listings(route) : PATHS.calculator;
}

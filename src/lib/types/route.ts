import type { ListingSort, ListingView } from "./listing";

export type Route =
  | { name: "calculator" }
  | { name: "listings"; sort: ListingSort; view: ListingView }
  /** 공유받기. 토큰은 주소 그대로(대소문자 유지)이고 모양 검사는 화면이 한다. */
  | { name: "share"; token: string };

/** 상단 탭이 있는 화면 */
export type TabName = Exclude<Route["name"], "share">;

import type { ListingSort, ListingSortOrder, ListingView } from "./listing";

/** 카카오 로그인에서 돌아온 결과(`#/listings?login=`). 성공은 값 없이 돌아온다. */
export type LoginResult = "cancelled" | "failed" | "notConfigured";

export type Route =
  | { name: "calculator" }
  /**
   * 정렬·방향·보기는 주소에 있을 때만 값이 있다. 없는 값은 화면이 기억·기본값으로 채운다(ADR-025 D2).
   * `login`은 계정 줄이 한 번 잡아 안내한 뒤 주소에서 지운다. 정규화가 먼저 지우지 않도록 라우트에 둔다.
   */
  | {
      name: "listings";
      sort?: ListingSort;
      order?: ListingSortOrder;
      view?: ListingView;
      login?: LoginResult;
    }
  /** 공유받기. 토큰은 주소 그대로(대소문자 유지)이고 모양 검사는 화면이 한다. */
  | { name: "share"; token: string };

/** 상단 탭이 있는 화면 */
export type TabName = Exclude<Route["name"], "share">;

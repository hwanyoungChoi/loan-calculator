import type { ListingSort, ListingView } from "@/lib/types/listing";
import type { LoginResult } from "@/lib/types/route";

export const PATHS = {
  calculator: "#/",
  /** 기본값(자기자금순, 카드)은 쿼리에 쓰지 않는다. `login`은 로그인에서 돌아온 결과(서버가 붙인다). */
  listings: (sort: ListingSort = "ownFunds", view: ListingView = "card", login?: LoginResult) => {
    const query = new URLSearchParams({
      ...(sort !== "ownFunds" && { sort }),
      ...(view !== "card" && { view }),
      ...(login !== undefined && { login }),
    }).toString();
    return query === "" ? "#/listings" : `#/listings?${query}`;
  },
  /** 토큰은 받은 그대로 둔다(대소문자 구분). */
  share: (token: string) => `#/share/${token}`,
  /** 카카오 로그인 시작. 해시 라우트가 아니라 Worker 경로라 페이지 전체가 이동한다. */
  kakaoLogin: "/api/auth/kakao/login",
};

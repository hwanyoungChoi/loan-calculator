import type { Route } from "@/lib/types/route";

type ListingsPathParams = Omit<Extract<Route, { name: "listings" }>, "name">;

export const PATHS = {
  calculator: "#/",
  /**
   * 받은 값만 쿼리에 쓰고 기본값이어도 생략하지 않는다(값 없음 = 기억 사용, ADR-025 D2). 인자가 없으면 `#/listings`.
   * `login`은 로그인에서 돌아온 결과(서버가 붙인다).
   */
  listings: ({ sort, order, view, login }: ListingsPathParams = {}) => {
    const query = new URLSearchParams({
      ...(sort !== undefined && { sort }),
      ...(order !== undefined && { order }),
      ...(view !== undefined && { view }),
      ...(login !== undefined && { login }),
    }).toString();
    return query === "" ? "#/listings" : `#/listings?${query}`;
  },
  /** 토큰은 받은 그대로 둔다(대소문자 구분). */
  share: (token: string) => `#/share/${token}`,
  /** 카카오 로그인 시작. 해시 라우트가 아니라 Worker 경로라 페이지 전체가 이동한다. */
  kakaoLogin: "/api/auth/kakao/login",
};

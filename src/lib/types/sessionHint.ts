/**
 * 이 브라우저에 세션 쿠키가 있을 수 있는지. 쿠키는 HttpOnly라 읽을 수 없어 `/api/me` 결과로 기록한다.
 * `/api/me`가 실패했을 때 로그인한 적 없는 사용자는 로컬로 계속 쓰고, 로그인했던 사용자는 막는 데 쓴다.
 */
export type SessionHintStore = {
  has: () => boolean;
  /** `/api/me`가 사용자를 돌려줬을 때 */
  mark: () => void;
  /** `/api/me`가 `{user:null}`, 로그아웃, 401일 때 */
  clear: () => void;
};

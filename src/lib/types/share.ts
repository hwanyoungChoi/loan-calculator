// /api/shares 계약. 서버(server/)도 type-only import로 이 파일을 쓴다(계약의 원본은 한 곳).
import type { ListingInput } from "./listing";

/** 공유 스냅샷 한 항목. 메모는 1~500자이고 빈 문자열은 없다(키 없음 = 메모 없음). */
export type ShareListing = ListingInput;

/** listing: 매물 정확히 1개 / list: 저장 목록 1~100개 */
export type ShareKind = "listing" | "list";

/** POST /api/shares 요청 본문(128KB 이하) */
export type CreateShareRequest = { kind: ShareKind; listings: ShareListing[] };

/** POST /api/shares → 201. `ownerKey`는 끊기(DELETE)의 `X-Share-Owner-Key` 값이고 다시 받을 수 없다. */
export type CreateShareResponse = {
  token: string;
  /** `{origin}/#/share/{token}` */
  url: string;
  /** ISO 8601, 만든 시각 + 30일 */
  expiresAt: string;
  ownerKey: string;
};

/** GET /api/shares/{token} → 200 */
export type ShareResponse = {
  kind: ShareKind;
  listings: ShareListing[];
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  expiresAt: string;
};

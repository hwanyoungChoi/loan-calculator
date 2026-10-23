// /api/me, /api/listings 계약(스펙 account-sync-share "태스크 2"). 응답의 `Listing`은 로컬 타입 그대로다.
import type { Listing, ListingInput } from "./listing";

/** GET /api/me → 200. 로그인 안 했으면 `user`가 null이다. `id`는 내부 id(카카오 회원번호 아님). */
export type MeResponse = { user: { id: string } | null };

/** GET /api/listings → 200 */
export type ListingListResponse = { listings: Listing[] };

/** POST /api/listings, PUT /api/listings/{id} 요청. PUT은 `memo` 키를 읽지 않는다(기존 메모 유지). */
export type ListingRequest = { listing: ListingInput };

/** PATCH /api/listings/{id} 요청. 빈 문자열이면 메모를 지운다. */
export type ListingMemoRequest = { memo: string };

/** POST(201)·PUT·PATCH(200) /api/listings 응답 */
export type ListingResponse = { listing: Listing };

/** POST /api/listings/import 요청. 1~100개, id·시각 포함 */
export type ImportListingsRequest = { listings: Listing[] };

/** POST /api/listings/import → 200 */
export type ImportListingsResponse = { imported: number; skipped: number };

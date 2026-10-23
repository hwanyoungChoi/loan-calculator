// 로그인 사용자의 계정 직접 정렬 순서(ADR-026, `users.listing_order` JSON 문자열). 값 검증은 `isListingOrder`.
import { isListingOrder } from "../../src/lib/utils/isListingOrder";
import { readJsonBody } from "../http/readJsonBody";
import { errorResponse, jsonResponse } from "../http/response";

import type { ImportListingOrderResponse, ListingOrderResponse } from "../../src/lib/types/account";

/** 최악 500 × (id 64자 + 따옴표 2 + 쉼표 1) ≈ 33.5KB에 여유를 둔다. */
const LISTING_ORDER_MAX_BYTES = 64 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

type ListingOrderRow = { listing_order: string | null };

const invalidListingOrder = (message: string) => errorResponse(400, "invalidParams", message);

function readIdsField(value: unknown): unknown {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>).ids
    : undefined;
}

/** 서버가 검증해서 쓴 값만 들어 있으므로 다시 검증하지 않는다. */
const parseStoredOrder = (stored: string | null): string[] | null =>
  stored === null ? null : (JSON.parse(stored) as string[]);

/** GET /api/listing-order → 200 `{ ids }`, 없으면 null */
export async function getListingOrder(db: D1Database, userId: string): Promise<Response> {
  const row = await db
    .prepare("SELECT listing_order FROM users WHERE id = ?")
    .bind(userId)
    .first<ListingOrderRow>();
  const body: ListingOrderResponse = { ids: parseStoredOrder(row?.listing_order ?? null) };
  return jsonResponse(200, body, NO_STORE);
}

/** PUT /api/listing-order `{ ids: string[] | null }`. null이면 지운다. 응답은 저장된 값 */
export async function putListingOrder(
  request: Request,
  db: D1Database,
  userId: string,
): Promise<Response> {
  const body = await readJsonBody(request, LISTING_ORDER_MAX_BYTES);
  if (!body.ok) return body.response;
  const ids = readIdsField(body.value);
  if (ids !== null && !isListingOrder(ids)) {
    return invalidListingOrder(
      "요청 본문은 { ids } 객체이고 중복 없는 매물 id 0~500개 배열 또는 null이어야 합니다",
    );
  }

  await db
    .prepare("UPDATE users SET listing_order = ?2 WHERE id = ?1")
    .bind(userId, ids === null ? null : JSON.stringify(ids))
    .run();
  const response: ListingOrderResponse = { ids };
  return jsonResponse(200, response, NO_STORE);
}

/**
 * POST /api/listing-order/import `{ ids: string[] }`. 계정 순서가 비어 있을 때만 채운다.
 * 한 문장 UPDATE라 두 기기가 동시에 첫 로그인해도 먼저 온 값 하나만 남는다. 응답은 계정의 현재 값
 */
export async function importListingOrder(
  request: Request,
  db: D1Database,
  userId: string,
): Promise<Response> {
  const body = await readJsonBody(request, LISTING_ORDER_MAX_BYTES);
  if (!body.ok) return body.response;
  const ids = readIdsField(body.value);
  if (!isListingOrder(ids)) {
    return invalidListingOrder(
      "요청 본문은 { ids } 객체이고 중복 없는 매물 id 0~500개 배열이어야 합니다",
    );
  }

  const row = await db
    .prepare(
      "UPDATE users SET listing_order = COALESCE(listing_order, ?2) WHERE id = ?1 RETURNING listing_order",
    )
    .bind(userId, JSON.stringify(ids))
    .first<{ listing_order: string }>();
  // 세션이 있으면 users 행도 있다(sessions → users FK). 없으면 라우터가 500으로 바꾼다.
  if (row === null) throw new Error("users row missing");
  const response: ImportListingOrderResponse = { ids: JSON.parse(row.listing_order) as string[] };
  return jsonResponse(200, response, NO_STORE);
}

// 로그인 사용자의 저장 목록(ADR-023 D3·D4). 행마다 `data`에 ListingInput JSON을 둔다.
// POST·PUT·PATCH의 updatedAt은 서버 시각, import는 넘어온 시각을 그대로 쓴다.
import { parseImportRequest, parseListingRequest, parseMemoRequest } from "./parseListingRequests";
import { createRandomId } from "../../src/lib/utils/createRandomId";
import { isListingId } from "../../src/lib/utils/validateListingFields";
import { readJsonBody } from "../http/readJsonBody";
import { errorResponse, jsonResponse, noContentResponse } from "../http/response";

import type {
  ImportListingsResponse,
  ListingListResponse,
  ListingResponse,
} from "../../src/lib/types/account";
import type { Listing, ListingInput } from "../../src/lib/types/listing";

const LISTING_MAX_BYTES = 512 * 1024;
const ACCOUNT_LISTINGS_MAX = 500;
const NO_STORE = { "Cache-Control": "no-store" };

type ListingRow = { id: string; data: string; created_at: string; updated_at: string };

const toListing = (row: ListingRow): Listing => ({
  id: row.id,
  ...(JSON.parse(row.data) as ListingInput),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const invalidParams = (message: string) => errorResponse(400, "invalidParams", message);
const invalidId = () => invalidParams("매물 id 형식이 올바르지 않습니다");
const limitExceeded = () =>
  invalidParams(`계정에는 매물을 ${ACCOUNT_LISTINGS_MAX}개까지 저장할 수 있습니다`);
const listingNotFound = () =>
  errorResponse(404, "notFound", "없거나 다른 기기에서 삭제된 매물입니다");

const listingResponse = (status: number, listing: Listing) => {
  const body: ListingResponse = { listing };
  return jsonResponse(status, body, NO_STORE);
};

/** GET /api/listings. 정렬은 클라이언트가 한다. */
export async function listListings(db: D1Database, userId: string): Promise<Response> {
  const { results } = await db
    .prepare("SELECT id, data, created_at, updated_at FROM listings WHERE user_id = ?")
    .bind(userId)
    .all<ListingRow>();
  const body: ListingListResponse = { listings: results.map(toListing) };
  return jsonResponse(200, body, NO_STORE);
}

/** POST /api/listings. id·시각은 서버가 만든다. 이미 500개면 넣지 않고 400 */
export async function createListing(
  request: Request,
  db: D1Database,
  userId: string,
  now: () => Date,
): Promise<Response> {
  const body = await readJsonBody(request, LISTING_MAX_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseListingRequest(body.value);
  if (!parsed.ok) return invalidParams(parsed.message);

  const createdAt = now().toISOString();
  const listing: Listing = {
    id: createRandomId(),
    ...parsed.value,
    createdAt,
    updatedAt: createdAt,
  };
  // 개수 확인과 넣기를 한 문장으로 해서 500개를 넘겨 넣지 않는다.
  const inserted = await db
    .prepare(
      `INSERT INTO listings (user_id, id, data, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?4, ?4
       WHERE (SELECT COUNT(*) FROM listings WHERE user_id = ?1) < ?5`,
    )
    .bind(userId, listing.id, JSON.stringify(parsed.value), createdAt, ACCOUNT_LISTINGS_MAX)
    .run();
  if (inserted.meta.changes === 0) return limitExceeded();
  return listingResponse(201, listing);
}

/**
 * PUT /api/listings/{id}. 본문의 `memo`는 읽지 않고 기존 메모를 그대로 둔다.
 * SELECT 후 UPDATE를 하지 않고 한 문장으로 해서, 다른 기기가 그 사이 쓴 메모를 지우지 않는다.
 */
export async function replaceListing(
  request: Request,
  id: string,
  db: D1Database,
  userId: string,
  now: () => Date,
): Promise<Response> {
  if (!isListingId(id)) return invalidId();
  const body = await readJsonBody(request, LISTING_MAX_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseListingRequest(body.value);
  if (!parsed.ok) return invalidParams(parsed.message);

  const fields: ListingInput = { ...parsed.value };
  delete fields.memo;
  const row = await db
    .prepare(
      `UPDATE listings
       SET data = CASE
             WHEN json_type(data, '$.memo') IS NULL THEN json(?3)
             ELSE json_set(?3, '$.memo', json_extract(data, '$.memo'))
           END,
           updated_at = ?4
       WHERE user_id = ?1 AND id = ?2
       RETURNING id, data, created_at, updated_at`,
    )
    .bind(userId, id, JSON.stringify(fields), now().toISOString())
    .first<ListingRow>();
  return row === null ? listingNotFound() : listingResponse(200, toListing(row));
}

/**
 * PATCH /api/listings/{id} `{ memo }`. `memo` 키만 바꾸거나(빈 문자열이면) 지운다.
 * 한 문장 UPDATE라 다른 기기가 바꾼 가격 등 다른 필드를 되돌리지 않는다.
 */
export async function updateListingMemo(
  request: Request,
  id: string,
  db: D1Database,
  userId: string,
  now: () => Date,
): Promise<Response> {
  if (!isListingId(id)) return invalidId();
  const body = await readJsonBody(request, LISTING_MAX_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseMemoRequest(body.value);
  if (!parsed.ok) return invalidParams(parsed.message);

  const row = await db
    .prepare(
      `UPDATE listings
       SET data = CASE WHEN ?3 = '' THEN json_remove(data, '$.memo') ELSE json_set(data, '$.memo', ?3) END,
           updated_at = ?4
       WHERE user_id = ?1 AND id = ?2
       RETURNING id, data, created_at, updated_at`,
    )
    .bind(userId, id, parsed.value, now().toISOString())
    .first<ListingRow>();
  return row === null ? listingNotFound() : listingResponse(200, toListing(row));
}

/** DELETE /api/listings/{id} → 204, 없으면 404 */
export async function deleteListing(id: string, db: D1Database, userId: string): Promise<Response> {
  if (!isListingId(id)) return invalidId();
  const deleted = await db
    .prepare("DELETE FROM listings WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();
  return deleted.meta.changes === 0 ? listingNotFound() : noContentResponse();
}

/**
 * POST /api/listings/import. 이미 있는 id(같은 요청 안의 뒤쪽 중복 포함)는 건너뛰어 다시 보내도 중복이 없다.
 * 상한은 "요청 중 아직 없는 id 수"만 더해 본다(이미 옮긴 id의 재시도는 막지 않음). 넘으면 아무것도 넣지 않고 400.
 * 개수 확인과 넣기 사이의 경합으로 상한을 조금 넘는 것은 허용한다(인증 뒤, ADR-023).
 * 넣기는 `json_each` 한 문장이라 바인딩 2개·쿼리 1개다(D1 쿼리당 바인딩 100개, 호출당 쿼리 50개 한도 안).
 */
export async function importListings(
  request: Request,
  db: D1Database,
  userId: string,
): Promise<Response> {
  const body = await readJsonBody(request, LISTING_MAX_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseImportRequest(body.value);
  if (!parsed.ok) return invalidParams(parsed.message);

  const listings = parsed.value;
  const listingsJson = JSON.stringify(listings);
  const counts = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM listings WHERE user_id = ?1) AS total,
         (SELECT COUNT(*) FROM listings
           WHERE user_id = ?1 AND id IN (SELECT json_extract(value, '$.id') FROM json_each(?2))) AS existing`,
    )
    .bind(userId, listingsJson)
    .first<{ total: number; existing: number }>();
  const newCount = new Set(listings.map((listing) => listing.id)).size - (counts?.existing ?? 0);
  if ((counts?.total ?? 0) + newCount > ACCOUNT_LISTINGS_MAX) return limitExceeded();

  // WHERE true: INSERT … SELECT 뒤에 ON CONFLICT를 쓸 때 SQLite 구문 모호성을 피하는 공식 권장 형태
  const inserted = await db
    .prepare(
      `INSERT INTO listings (user_id, id, data, created_at, updated_at)
       SELECT ?1, json_extract(value, '$.id'), json_extract(value, '$.data'),
              json_extract(value, '$.createdAt'), json_extract(value, '$.updatedAt')
       FROM json_each(?2)
       WHERE true
       ORDER BY key
       ON CONFLICT (user_id, id) DO NOTHING`,
    )
    .bind(userId, listingsJson)
    .run();
  const imported = inserted.meta.changes;
  const response: ImportListingsResponse = { imported, skipped: listings.length - imported };
  return jsonResponse(200, response, NO_STORE);
}

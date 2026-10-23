import { parseShareRequest } from "./parseShareRequest";
import { randomBase64url, sha256Hex } from "../crypto/tokens";
import { readJsonBody } from "../http/readJsonBody";
import { errorResponse, jsonResponse, noContentResponse } from "../http/response";

import type {
  CreateShareResponse,
  ShareKind,
  ShareListing,
  ShareResponse,
} from "../../src/lib/types/share";

const SHARE_MAX_BYTES = 128 * 1024;
const SHARE_TTL_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_BYTES = 16;
const OWNER_KEY_BYTES = 32;
/** 16바이트 base64url. 모양이 다르면 DB를 보지 않고 404 */
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

type ShareRow = { kind: ShareKind; payload: string; created_at: number; expires_at: number };

const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);
const toIsoString = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();

const shareNotFound = () => errorResponse(404, "notFound", "없거나 끊긴 공유 링크입니다");

/** POST /api/shares. 만료 행은 여기서만 정리한다(GET은 지우지 않음, 크론 없음). */
export async function createShare(
  request: Request,
  db: D1Database,
  now: () => Date,
): Promise<Response> {
  const body = await readJsonBody(request, SHARE_MAX_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseShareRequest(body.value);
  if (!parsed.ok) return errorResponse(400, "invalidParams", parsed.message);

  const createdAt = toUnixSeconds(now());
  const expiresAt = createdAt + SHARE_TTL_SECONDS;
  const token = randomBase64url(TOKEN_BYTES);
  const ownerKey = randomBase64url(OWNER_KEY_BYTES);

  await db.batch([
    db.prepare("DELETE FROM shares WHERE expires_at < ?").bind(createdAt),
    db
      .prepare(
        "INSERT INTO shares (token, kind, payload, owner_key_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        token,
        parsed.kind,
        JSON.stringify(parsed.listings),
        await sha256Hex(ownerKey),
        createdAt,
        expiresAt,
      ),
  ]);

  const response: CreateShareResponse = {
    token,
    url: `${new URL(request.url).origin}/#/share/${token}`,
    expiresAt: toIsoString(expiresAt),
    ownerKey,
  };
  return jsonResponse(201, response, { "Cache-Control": "no-store" });
}

/** GET /api/shares/{token}. 만료됐지만 아직 정리 전이면 410, 정리 뒤·끊김·없음은 404 */
export async function getShare(token: string, db: D1Database, now: () => Date): Promise<Response> {
  if (!SHARE_TOKEN_PATTERN.test(token)) return shareNotFound();
  const row = await db
    .prepare("SELECT kind, payload, created_at, expires_at FROM shares WHERE token = ?")
    .bind(token)
    .first<ShareRow>();
  if (row === null) return shareNotFound();
  if (row.expires_at < toUnixSeconds(now())) {
    return errorResponse(410, "shareGone", "만료된 공유 링크입니다");
  }

  const response: ShareResponse = {
    kind: row.kind,
    listings: JSON.parse(row.payload) as ShareListing[],
    createdAt: toIsoString(row.created_at),
    expiresAt: toIsoString(row.expires_at),
  };
  // 끊은 링크가 캐시로 열리지 않게
  return jsonResponse(200, response, { "Cache-Control": "no-store" });
}

/** DELETE /api/shares/{token}. `X-Share-Owner-Key`의 해시가 맞으면 행을 지운다. */
export async function revokeShare(
  request: Request,
  token: string,
  db: D1Database,
): Promise<Response> {
  if (!SHARE_TOKEN_PATTERN.test(token)) return shareNotFound();
  const ownerKeyHash = await sha256Hex(request.headers.get("X-Share-Owner-Key") ?? "");
  const deleted = await db
    .prepare("DELETE FROM shares WHERE token = ? AND owner_key_hash = ?")
    .bind(token, ownerKeyHash)
    .run();
  if (deleted.meta.changes > 0) return noContentResponse();

  const exists = await db.prepare("SELECT 1 FROM shares WHERE token = ?").bind(token).first();
  return exists === null
    ? shareNotFound()
    : errorResponse(403, "forbidden", "공유 링크를 끊을 권한이 없습니다");
}

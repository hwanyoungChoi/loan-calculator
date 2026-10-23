// 세션(ADR-023 D5). Lucia 예제 방식: 토큰 `{id}.{secret}`, DB에는 secret의 SHA-256만,
// 마지막 확인 시각 기준 30일 만료, 1시간 넘게 지나면 확인 시각을 갱신하고 쿠키를 다시 내린다.
import { randomBase64url, sha256Hex } from "../crypto/tokens";
import { readCookie } from "../http/readCookie";
import { errorResponse } from "../http/response";

const SESSION_COOKIE = "mf_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const REFRESH_AFTER_SECONDS = 60 * 60;
/** id 16바이트(22자) + secret 32바이트(43자), 둘 다 base64url */
const SESSION_ID_BYTES = 16;
const SESSION_SECRET_BYTES = 32;
const SESSION_TOKEN_PATTERN = /^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/;

type SessionToken = { id: string; secret: string };
type SessionRow = { user_id: string; secret_hash: string; last_verified_at: number };
type ValidSession = { userId: string; refreshedCookie: string | null };

const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

function sessionCookie(value: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

/** 로그아웃 응답에 실어 브라우저의 세션 쿠키를 지운다. */
export const expiredSessionCookie = () => sessionCookie("", 0);

/** 쿠키가 없거나 모양이 틀리면 null(→ 인증 실패) */
function readSessionToken(request: Request): SessionToken | null {
  const value = readCookie(request, SESSION_COOKIE);
  const match = value === null ? null : SESSION_TOKEN_PATTERN.exec(value);
  return match === null ? null : { id: match[1], secret: match[2] };
}

function isSameHash(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const [leftBytes, rightBytes] = [encoder.encode(left), encoder.encode(right)];
  return (
    leftBytes.byteLength === rightBytes.byteLength &&
    crypto.subtle.timingSafeEqual(leftBytes, rightBytes)
  );
}

/**
 * 로그인 성공 때 세션을 만들고 `Set-Cookie` 값을 돌려준다.
 * 같은 사용자의 만료 세션을 같은 배치에서 지워 정리 크론 없이도 쌓이지 않게 한다.
 */
export async function createSession(
  db: D1Database,
  userId: string,
  now: () => Date,
): Promise<string> {
  const nowSeconds = toUnixSeconds(now());
  const id = randomBase64url(SESSION_ID_BYTES);
  const secret = randomBase64url(SESSION_SECRET_BYTES);
  await db.batch([
    db
      .prepare("DELETE FROM sessions WHERE user_id = ? AND last_verified_at <= ?")
      .bind(userId, nowSeconds - SESSION_TTL_SECONDS),
    db
      .prepare(
        "INSERT INTO sessions (id, user_id, secret_hash, created_at, last_verified_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(id, userId, await sha256Hex(secret), nowSeconds, nowSeconds),
  ]);
  return sessionCookie(`${id}.${secret}`, SESSION_TTL_SECONDS);
}

/** 쿠키의 세션을 확인한다. 만료면 행을 지우고 null, 1시간 넘게 지났으면 확인 시각을 갱신한다. */
async function validateSession(
  request: Request,
  db: D1Database,
  now: () => Date,
): Promise<ValidSession | null> {
  const token = readSessionToken(request);
  if (token === null) return null;
  const row = await db
    .prepare("SELECT user_id, secret_hash, last_verified_at FROM sessions WHERE id = ?")
    .bind(token.id)
    .first<SessionRow>();
  if (row === null || !isSameHash(await sha256Hex(token.secret), row.secret_hash)) return null;

  const nowSeconds = toUnixSeconds(now());
  const elapsedSeconds = nowSeconds - row.last_verified_at;
  if (elapsedSeconds >= SESSION_TTL_SECONDS) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(token.id).run();
    return null;
  }
  if (elapsedSeconds < REFRESH_AFTER_SECONDS) return { userId: row.user_id, refreshedCookie: null };

  await db
    .prepare("UPDATE sessions SET last_verified_at = ? WHERE id = ?")
    .bind(nowSeconds, token.id)
    .run();
  return {
    userId: row.user_id,
    refreshedCookie: sessionCookie(`${token.id}.${token.secret}`, SESSION_TTL_SECONDS),
  };
}

/** 로그아웃: 쿠키의 id와 secret 해시가 모두 맞는 행만 지운다. 쿠키가 없거나 틀리면 아무것도 안 한다. */
export async function deleteSession(request: Request, db: D1Database): Promise<void> {
  const token = readSessionToken(request);
  if (token === null) return;
  await db
    .prepare("DELETE FROM sessions WHERE id = ? AND secret_hash = ?")
    .bind(token.id, await sha256Hex(token.secret))
    .run();
}

/**
 * 로그인이 선택인 처리(`/api/me`). 세션 연장 쿠키는 여기서만 응답에 붙인다(인증을 거치는 모든 응답 공통).
 * `handler`에는 로그인했으면 사용자 id, 아니면 null이 넘어간다.
 */
export async function withOptionalSession(
  request: Request,
  db: D1Database,
  now: () => Date,
  handler: (userId: string | null) => Promise<Response>,
): Promise<Response> {
  const session = await validateSession(request, db, now);
  const response = await handler(session?.userId ?? null);
  if (session?.refreshedCookie) response.headers.append("Set-Cookie", session.refreshedCookie);
  return response;
}

/** 로그인이 필요한 처리. 쿠키가 없거나 형식이 틀리거나 무효·만료면 401 unauthorized */
export function withSession(
  request: Request,
  db: D1Database,
  now: () => Date,
  handler: (userId: string) => Promise<Response>,
): Promise<Response> {
  return withOptionalSession(request, db, now, async (userId) =>
    userId === null ? errorResponse(401, "unauthorized", "로그인이 필요합니다") : handler(userId),
  );
}

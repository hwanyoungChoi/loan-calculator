import { fetchKakaoUserId } from "./kakaoApi";
import { createSession } from "./session";
import { createRandomId } from "../../src/lib/utils/createRandomId";
import { randomBase64url } from "../crypto/tokens";
import { readCookie } from "../http/readCookie";

import type { KakaoKeys } from "./kakaoApi";

const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const STATE_COOKIE = "mf_oauth_state";
const STATE_COOKIE_ATTRIBUTES = "HttpOnly; Secure; SameSite=Lax; Path=/api/auth/kakao";
const STATE_MAX_AGE_SECONDS = 600;
const STATE_BYTES = 32;

/** 저장 목록 화면이 `?login=`으로 받아 안내 한 줄을 보이는 값 */
type LoginResult = "cancelled" | "failed" | "notConfigured";

type KakaoEnv = { KAKAO_REST_API_KEY?: string; KAKAO_CLIENT_SECRET?: string };
type CallbackDeps = { fetch: typeof fetch; now: () => Date };

/** 시크릿 둘 중 하나라도 비면 null(→ notConfigured) */
function readKakaoKeys(env: KakaoEnv): KakaoKeys | null {
  const restApiKey = env.KAKAO_REST_API_KEY?.trim() ?? "";
  const clientSecret = env.KAKAO_CLIENT_SECRET?.trim() ?? "";
  return restApiKey === "" || clientSecret === "" ? null : { restApiKey, clientSecret };
}

/** 카카오에 등록한 Redirect URI와 같아야 한다(로그인 요청과 토큰 요청에 같은 값). */
const callbackUrl = (origin: string) => `${origin}/api/auth/kakao/callback`;

/** 로그인 뒤에는 항상 기본 저장 목록으로 돌아간다. */
const listingsUrl = (origin: string, result?: LoginResult) =>
  `${origin}/#/listings${result === undefined ? "" : `?login=${result}`}`;

function redirectResponse(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

/** GET /api/auth/kakao/login. state 쿠키를 심고 카카오 인가 화면으로 보낸다. 키가 없으면 notConfigured */
export function startKakaoLogin(request: Request, env: KakaoEnv): Response {
  const { origin } = new URL(request.url);
  const keys = readKakaoKeys(env);
  if (keys === null) return redirectResponse(listingsUrl(origin, "notConfigured"));

  const state = randomBase64url(STATE_BYTES);
  // 동의항목 없음(회원번호만): scope·prompt·nonce를 보내지 않는다.
  const authorizeParams = new URLSearchParams({
    client_id: keys.restApiKey,
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    state,
  });
  return redirectResponse(`${AUTHORIZE_URL}?${authorizeParams}`, [
    `${STATE_COOKIE}=${state}; ${STATE_COOKIE_ATTRIBUTES}; Max-Age=${STATE_MAX_AGE_SECONDS}`,
  ]);
}

/** 카카오 회원번호의 내부 사용자 id. 이미 있으면 id를 바꾸지 않는다(DO UPDATE로 덮으면 기존 목록이 끊긴다). */
async function findOrCreateUserId(db: D1Database, kakaoId: string, now: () => Date) {
  const [, selected] = await db.batch<{ id: string }>([
    db
      .prepare(
        "INSERT INTO users (id, kakao_id, created_at) VALUES (?, ?, ?) ON CONFLICT (kakao_id) DO NOTHING",
      )
      .bind(createRandomId(), kakaoId, now().toISOString()),
    db.prepare("SELECT id FROM users WHERE kakao_id = ?").bind(kakaoId),
  ]);
  return selected.results[0].id;
}

/**
 * GET /api/auth/kakao/callback. state를 먼저 비교하고(쿠키는 항상 지움) 취소·실패면 안내 값과 함께 저장 목록으로,
 * 성공하면 사용자를 찾거나 만들고 세션 쿠키를 심어 저장 목록으로 보낸다.
 */
export async function finishKakaoLogin(
  request: Request,
  env: KakaoEnv,
  db: D1Database,
  deps: CallbackDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const clearStateCookie = `${STATE_COOKIE}=; ${STATE_COOKIE_ATTRIBUTES}; Max-Age=0`;
  const fail = (result: LoginResult) =>
    redirectResponse(listingsUrl(url.origin, result), [clearStateCookie]);

  const state = url.searchParams.get("state");
  const savedState = readCookie(request, STATE_COOKIE);
  if (state === null || savedState === null || state !== savedState) return fail("failed");

  const error = url.searchParams.get("error");
  if (error === "access_denied") return fail("cancelled");
  const code = url.searchParams.get("code");
  if (error !== null || code === null || code === "") {
    // eslint-disable-next-line no-console
    console.error("kakao login failed", "authorize", error ?? "no code");
    return fail("failed");
  }

  const keys = readKakaoKeys(env);
  if (keys === null) return fail("failed");
  const kakaoId = await fetchKakaoUserId(deps, keys, code, callbackUrl(url.origin));
  if (kakaoId === null) return fail("failed");

  const userId = await findOrCreateUserId(db, kakaoId, deps.now);
  const sessionCookie = await createSession(db, userId, deps.now);
  return redirectResponse(listingsUrl(url.origin), [clearStateCookie, sessionCookie]);
}

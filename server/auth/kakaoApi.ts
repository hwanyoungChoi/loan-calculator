// 카카오 로그인 REST API 중 토큰 받기·사용자 정보 두 호출(2026-10-23 공식 문서 확인분).
// 액세스 토큰은 회원번호를 읽는 데 한 번 쓰고 버린다(저장하지 않음).

const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const USER_URL = "https://kapi.kakao.com/v2/user/me";
const TIMEOUT_MS = 10_000;

export type KakaoKeys = { restApiKey: string; clientSecret: string };

type KakaoUserIdDeps = { fetch: typeof fetch };

/** 카카오 오류 본문에서 오류 코드만 꺼낸다(토큰 API `error_code` 예: KOE237, 사용자 API `code` 예: -401). */
async function readErrorCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    return String(body.error_code ?? body.code ?? "unknown");
  } catch {
    return "unknown";
  }
}

function logFailure(step: string, detail: string) {
  // 토큰·인가 코드·회원번호는 남기지 않는다.
  // eslint-disable-next-line no-console
  console.error("kakao login failed", step, detail);
}

/**
 * 인가 코드 → 액세스 토큰 → 회원번호(10진 문자열). 어느 단계든 실패하면 null.
 * 회원번호가 안전 정수가 아니면 JSON 숫자 정밀도를 잃었을 수 있어 실패로 본다.
 */
export async function fetchKakaoUserId(
  deps: KakaoUserIdDeps,
  keys: KakaoKeys,
  code: string,
  redirectUri: string,
): Promise<string | null> {
  // deps.fetch(url)로 부르면 Workers에서 Illegal invocation이 날 수 있어 구조 분해해서 쓴다.
  const { fetch: fetchImpl } = deps;
  try {
    const tokenResponse = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: keys.restApiKey,
        redirect_uri: redirectUri,
        code,
        client_secret: keys.clientSecret,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!tokenResponse.ok) {
      logFailure("token", `${tokenResponse.status} ${await readErrorCode(tokenResponse)}`);
      return null;
    }
    const { access_token: accessToken } = (await tokenResponse.json()) as Record<string, unknown>;
    if (typeof accessToken !== "string" || accessToken === "") {
      logFailure("token", "no access_token");
      return null;
    }

    const userResponse = await fetchImpl(USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!userResponse.ok) {
      logFailure("user", `${userResponse.status} ${await readErrorCode(userResponse)}`);
      return null;
    }
    const { id } = (await userResponse.json()) as Record<string, unknown>;
    if (!Number.isSafeInteger(id)) {
      logFailure("user", "id is not a safe integer");
      return null;
    }
    return String(id);
  } catch (error) {
    logFailure("request", error instanceof Error ? error.name : typeof error);
    return null;
  }
}

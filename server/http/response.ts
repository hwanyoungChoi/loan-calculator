import type { ApiError } from "../../src/lib/types/api";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

/** 오류 본문은 `{ error, message }`, 항상 `Cache-Control: no-store` */
export function errorResponse(
  status: number,
  error: ApiError["error"],
  message: string,
  headers: Record<string, string> = {},
): Response {
  const body: ApiError = { error, message };
  return jsonResponse(status, body, { "Cache-Control": "no-store", ...headers });
}

/** 성공 204. 본문 없음 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

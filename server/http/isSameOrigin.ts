/**
 * CSRF 검사: GET/HEAD가 아닌 요청은 `Origin`이 요청 URL의 origin과 같아야 한다.
 * `Origin`이 없으면(curl 등) 다른 출처로 본다.
 */
export function isSameOrigin(request: Request): boolean {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

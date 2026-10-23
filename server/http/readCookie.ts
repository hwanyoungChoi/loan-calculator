/** `Cookie` 헤더에서 이름이 같은 첫 값. 없으면 null */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (header === null) return null;
  for (const pair of header.split(";")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    if (pair.slice(0, separatorIndex).trim() === name) return pair.slice(separatorIndex + 1).trim();
  }
  return null;
}

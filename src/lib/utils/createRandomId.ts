const ID_BYTE_LENGTH = 16;

/**
 * 매물 id. `crypto.randomUUID`는 secure context에서만 있어서 휴대폰으로
 * `http://192.168.x.x` 개발 서버를 열면 없다. getRandomValues는 어디서나 있다(ADR-010).
 */
export function createRandomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_BYTE_LENGTH));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

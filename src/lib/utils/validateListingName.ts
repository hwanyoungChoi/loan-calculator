export const LISTING_NAME_MAX_LENGTH = 40;

/** 글자 수는 코드포인트 기준이다. 이모지 하나가 2로 세어지지 않게 한다. */
export function countChars(text: string): number {
  return Array.from(text).length;
}

/** 제안 이름을 LISTING_NAME_MAX_LENGTH(코드포인트)로 자르고 앞뒤 공백을 걷는다. */
export function truncateListingName(name: string): string {
  return Array.from(name).slice(0, LISTING_NAME_MAX_LENGTH).join("").trim();
}

/** trim 후 1~40자(코드포인트 기준) */
export function validateListingName(
  raw: string,
): { ok: true; name: string } | { ok: false; message: string } {
  const name = raw.trim();
  const length = countChars(name);
  if (length === 0) return { ok: false, message: "매물 이름을 입력하세요" };
  if (length > LISTING_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `${LISTING_NAME_MAX_LENGTH}자 이하로 입력하세요(현재 ${length}자)`,
    };
  }
  return { ok: true, name };
}

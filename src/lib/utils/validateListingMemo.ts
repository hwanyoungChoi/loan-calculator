import { countChars } from "./validateListingName";

export const LISTING_MEMO_MAX_LENGTH = 500;

/** trim 후 0~500자(코드포인트 기준). 빈 메모는 메모를 지우는 것이다. */
export function validateListingMemo(
  raw: string,
): { ok: true; memo: string } | { ok: false; message: string } {
  const memo = raw.trim();
  const length = countChars(memo);
  if (length > LISTING_MEMO_MAX_LENGTH) {
    return {
      ok: false,
      message: `${LISTING_MEMO_MAX_LENGTH}자 이하로 입력하세요(현재 ${length}자)`,
    };
  }
  return { ok: true, memo };
}

import { formatThousands } from "./amount";
import { countChars } from "./validateListingName";

/**
 * 메모 상한(코드포인트). 클라이언트 입력·로컬 저장소·서버(POST·PUT·PATCH·import·공유)가 모두 이 값을 쓴다.
 * 올리면 요청 크기 최악값을 다시 계산한다(`src/hooks/useAccountImport.ts`의 import 배치, 공유 128KB).
 */
export const LISTING_MEMO_MAX_LENGTH = 5000;

/** trim 후 0~5,000자(코드포인트 기준). 빈 메모는 메모를 지우는 것이다. */
export function validateListingMemo(
  raw: string,
): { ok: true; memo: string } | { ok: false; message: string } {
  const memo = raw.trim();
  const length = countChars(memo);
  if (length > LISTING_MEMO_MAX_LENGTH) {
    return {
      ok: false,
      message: `${formatThousands(LISTING_MEMO_MAX_LENGTH)}자 이하로 입력하세요(현재 ${formatThousands(length)}자)`,
    };
  }
  return { ok: true, memo };
}

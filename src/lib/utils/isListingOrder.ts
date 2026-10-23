// 서버(worker tsc)와 클라이언트가 함께 쓴다. DOM 타입·`@/` 별칭 없이 상대 경로만 import한다.
import { isListingId } from "./validateListingFields";

/** 직접 정렬 순서의 최대 길이. 계정 매물 상한(`server/listings/handleListings.ts`의 500)과 같다. */
export const LISTING_ORDER_MAX_LENGTH = 500;

/**
 * 직접 정렬 순서 검증(ADR-026): 배열, 0~500개, 각 요소는 매물 id 규칙, 중복 없음.
 * 없는 매물 id는 허용한다(읽는 쪽이 무시). `/api/listing-order` 본문 검증의 단일 기준
 */
export function isListingOrder(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= LISTING_ORDER_MAX_LENGTH &&
    value.every(isListingId) &&
    new Set(value).size === value.length
  );
}

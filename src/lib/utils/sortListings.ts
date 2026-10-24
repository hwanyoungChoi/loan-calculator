import type { Listing } from "@/lib/types/listing";

/** 최신이 앞. ISO 문자열의 오프셋이 달라도 맞게 비교하려고 시각 값으로 비교한다. */
function byNewest(a: string, b: string): number {
  return Date.parse(b) - Date.parse(a);
}

/**
 * 저장 목록의 순서는 직접 정한 순서 하나다(ADR-026). 순서에 없는 매물(새로 저장·공유로 추가·이전)은 맨 위에
 * createdAt 최신순, 그 아래는 순서대로다. 순서에 있지만 목록에 없는 id(지운 매물)는 무시한다.
 * 순서가 없으면(null) 전부 순서에 없는 매물이라 최근 저장순이다. 안정 정렬이고 입력 배열을 바꾸지 않는다.
 */
export function sortListings(listings: Listing[], customOrder: string[] | null): Listing[] {
  const positions = new Map((customOrder ?? []).map((id, index) => [id, index]));
  return listings.toSorted((a, b) => {
    const positionA = positions.get(a.id);
    const positionB = positions.get(b.id);
    if (positionA === undefined || positionB === undefined) {
      if (positionA !== positionB) return positionA === undefined ? -1 : 1;
      return byNewest(a.createdAt, b.createdAt);
    }
    return positionA - positionB;
  });
}

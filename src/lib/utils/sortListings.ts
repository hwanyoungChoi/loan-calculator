import { calculateLoan } from "./calculateLoan";

import type { Listing, ListingSort } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type Sorter = (listings: Listing[], regulations: Regulations) => Listing[];

/** 최신이 앞. ISO 문자열의 오프셋이 달라도 맞게 비교하려고 시각 값으로 비교한다. */
function byNewest(a: string, b: string): number {
  return Date.parse(b) - Date.parse(a);
}

/** 자기자금 오름차순 → createdAt 최신순 → 입력 순서. 미확인(자기자금 null)은 맨 뒤에 createdAt 최신순 */
const sortByOwnFunds: Sorter = (listings, regulations) =>
  listings
    .map((listing) => ({ listing, ownFunds: calculateLoan(listing, regulations).ownFunds }))
    .sort((a, b) => {
      if (a.ownFunds !== b.ownFunds) {
        if (a.ownFunds === null) return 1;
        if (b.ownFunds === null) return -1;
        return a.ownFunds - b.ownFunds;
      }
      return byNewest(a.listing.createdAt, b.listing.createdAt);
    })
    .map(({ listing }) => listing);

/** updatedAt 최신순. 자기자금을 쓰지 않으므로 미확인 여부는 순서에 영향이 없다. */
const sortByRecent: Sorter = (listings) =>
  listings.toSorted((a, b) => byNewest(a.updatedAt, b.updatedAt));

const SORTERS: Record<ListingSort, Sorter> = {
  ownFunds: sortByOwnFunds,
  recent: sortByRecent,
};

/** 정렬은 안정 정렬이고 입력 배열을 바꾸지 않는다. 결과는 현재 규제로 다시 계산한 값 기준이다(ADR-007). */
export function sortListings(
  listings: Listing[],
  sort: ListingSort,
  regulations: Regulations,
): Listing[] {
  return SORTERS[sort](listings, regulations);
}

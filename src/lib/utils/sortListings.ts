import { calculateLoan } from "./calculateLoan";

import type { Listing, ListingSort, ListingSortOrder } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

/** 첫째 기준 비교값에 곱한다. 동률 처리는 방향과 상관없이 그대로다(ADR-025). */
const ORDER_SIGN: Record<ListingSortOrder, 1 | -1> = { asc: 1, desc: -1 };

type Sorter = (listings: Listing[], sign: 1 | -1, regulations: Regulations) => Listing[];

/** 이른 시각이 앞. ISO 문자열의 오프셋이 달라도 맞게 비교하려고 시각 값으로 비교한다. */
function byOldest(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

/** 최신이 앞 */
function byNewest(a: string, b: string): number {
  return byOldest(b, a);
}

/**
 * 자기자금 순(asc 적은 순, desc 많은 순) → createdAt 최신순 → 입력 순서.
 * 계산 불가(미확인·요건 미충족, 자기자금 null)는 둘을 구분하지 않고 방향과 상관없이 맨 뒤에 createdAt 최신순이다.
 */
const sortByOwnFunds: Sorter = (listings, sign, regulations) =>
  listings
    .map((listing) => ({ listing, ownFunds: calculateLoan(listing, regulations).ownFunds }))
    .sort((a, b) => {
      if (a.ownFunds !== b.ownFunds) {
        if (a.ownFunds === null) return 1;
        if (b.ownFunds === null) return -1;
        return (a.ownFunds - b.ownFunds) * sign;
      }
      return byNewest(a.listing.createdAt, b.listing.createdAt);
    })
    .map(({ listing }) => listing);

/** updatedAt 순(desc 최신 먼저). 자기자금을 쓰지 않으므로 미확인 여부는 순서에 영향이 없다. */
const sortByRecent: Sorter = (listings, sign) =>
  listings.toSorted((a, b) => byOldest(a.updatedAt, b.updatedAt) * sign);

/** 한국어 이름순. 숫자는 자연 정렬이라 "2단지"가 "10단지"보다 앞이다(ECMA-402). */
const nameCollator = new Intl.Collator("ko", { numeric: true });

/** 이름순(asc 가→하) → 같으면 createdAt 최신순 */
const sortByName: Sorter = (listings, sign) =>
  listings.toSorted(
    (a, b) => nameCollator.compare(a.name, b.name) * sign || byNewest(a.createdAt, b.createdAt),
  );

const SORTERS: Record<ListingSort, Sorter> = {
  ownFunds: sortByOwnFunds,
  recent: sortByRecent,
  name: sortByName,
};

/** 정렬은 안정 정렬이고 입력 배열을 바꾸지 않는다. 결과는 현재 규제로 다시 계산한 값 기준이다(ADR-007). */
export function sortListings(
  listings: Listing[],
  sort: ListingSort,
  order: ListingSortOrder,
  regulations: Regulations,
): Listing[] {
  return SORTERS[sort](listings, ORDER_SIGN[order], regulations);
}

// 시그니처 스텁(태스크 1-1). 구현은 태스크 2-1.
import type { Listing, ListingSort } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

export const sortListings: (
  listings: Listing[],
  sort: ListingSort,
  regulations: Regulations,
) => Listing[] = () => {
  throw new Error("미구현: 태스크 2-1");
};

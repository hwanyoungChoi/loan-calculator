import type { ListingSort, ListingView } from "@/lib/types/listing";

export const PATHS = {
  calculator: "#/",
  /** 기본값(자기자금순, 카드)은 쿼리에 쓰지 않는다. */
  listings: (sort: ListingSort = "ownFunds", view: ListingView = "card") => {
    const query = new URLSearchParams({
      ...(sort !== "ownFunds" && { sort }),
      ...(view !== "card" && { view }),
    }).toString();
    return query === "" ? "#/listings" : `#/listings?${query}`;
  },
};

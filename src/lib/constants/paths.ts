import type { ListingSort } from "@/lib/types/listing";

export const PATHS = {
  calculator: "#/",
  listings: (sort: ListingSort = "ownFunds") =>
    sort === "ownFunds" ? "#/listings" : `#/listings?sort=${sort}`,
};

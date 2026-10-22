import type { ListingSort, ListingView } from "./listing";

export type Route =
  { name: "calculator" } | { name: "listings"; sort: ListingSort; view: ListingView };

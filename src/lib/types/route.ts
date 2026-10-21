import type { ListingSort } from "./listing";

export type Route = { name: "calculator" } | { name: "listings"; sort: ListingSort };

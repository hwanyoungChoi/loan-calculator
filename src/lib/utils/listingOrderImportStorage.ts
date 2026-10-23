import { createUserIdRecordStore } from "./userIdRecordStorage";

import type { ListingOrderImportStore } from "@/lib/types/listingOrder";

/** 새 키(기존 키는 건드리지 않는다, AC-0) */
export const LISTING_ORDER_IMPORTS_STORAGE_KEY = "loan-calculator/listing-order-imports";

/** 키 `loan-calculator/listing-order-imports`. 기기 순서(`loan-calculator/listing-order`)는 읽기만 한다. */
export function createListingOrderImportStore({
  storage,
}: {
  storage: Storage;
}): ListingOrderImportStore {
  return createUserIdRecordStore({ storage, key: LISTING_ORDER_IMPORTS_STORAGE_KEY });
}

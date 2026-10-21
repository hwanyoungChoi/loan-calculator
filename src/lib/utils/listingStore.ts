// 시그니처 스텁(태스크 1-1). 구현은 태스크 2-1.
import type { ListingStore } from "@/lib/types/listing";

export type ListingStoreOptions = {
  storage: Storage;
  /** 비어 있지 않은 문자열 */
  createId: () => string;
  /** ISO 8601 */
  now: () => string;
};

export const createListingStore: (options: ListingStoreOptions) => ListingStore = () => {
  throw new Error("미구현: 태스크 2-1");
};

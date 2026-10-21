// 시그니처 스텁(태스크 1-1). 구현은 태스크 2-1.
import type { Listing, LoadListingsResult } from "@/lib/types/listing";
import type { StorageWriteResult } from "@/lib/types/storage";

/** 키 `loan-calculator/listings`. 키 없음은 빈 목록, 하나라도 어긋나면 전체 corrupt */
export const loadListings: (storage: Storage) => LoadListingsResult = () => {
  throw new Error("미구현: 태스크 2-1");
};

export const saveListings: (storage: Storage, listings: Listing[]) => StorageWriteResult = () => {
  throw new Error("미구현: 태스크 2-1");
};

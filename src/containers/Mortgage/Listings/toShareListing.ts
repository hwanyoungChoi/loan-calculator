import { toListingFields } from "@/lib/utils/listingStore";

import type { Listing } from "@/lib/types/listing";
import type { ShareListing } from "@/lib/types/share";

export function hasMemo(listing: Listing): boolean {
  return listing.memo !== undefined && listing.memo !== "";
}

/**
 * 공유 스냅샷 한 항목: 입력값만(id·시각 없음, ADR-007). 메모는 사용자가 함께 보내기를 켰을 때만 넣는다.
 * 상태(후보·보류·비후보)는 내 판단이라 보내지 않는다(ADR-027).
 */
export function toShareListing(listing: Listing, includeMemo: boolean): ShareListing {
  return toListingFields({
    ...listing,
    status: undefined,
    ...(!includeMemo && { memo: undefined }),
  });
}

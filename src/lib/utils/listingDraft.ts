import { LTV_PRESETS } from "@/lib/constants/draft";

import { isOneOf } from "./isOneOf";
import { truncateListingName } from "./validateListingName";

import type { Draft } from "@/lib/types/draft";
import type { Listing, ListingListState } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

/** 저장 매물을 열 때 draft를 통째로 바꿀 값(ADR-004). 사용자 지정 LTV가 칩 값(40·70·80)이 아니면 [직접 입력]으로 연다. */
export function listingToDraft(listing: Listing): Draft {
  const customLtv =
    typeof listing.customLtvRate === "number" ? String(listing.customLtvRate) : null;
  return {
    salePrice: String(listing.salePrice),
    kbPrice: String(listing.kbPrice),
    region: listing.region,
    borrower: listing.borrower,
    listingId: listing.id,
    customLtv,
    isCustomLtvInput: customLtv !== null && !isOneOf(LTV_PRESETS, customLtv),
    isAreaOver85: listing.isAreaOver85 === true,
  };
}

/** 매물 복사: 값은 그대로 채우되 매물 연결이 없는 새 매물로 연다. 원본은 바뀌지 않는다. */
export function listingToCopyDraft(listing: Listing): Draft {
  return { ...listingToDraft(listing), listingId: null };
}

/** 복사한 매물의 저장 이름 제안. 40자를 넘으면 스크린샷 제안과 같은 규칙으로 자른다. */
export function copiedListingName(name: string): string {
  return truncateListingName(`${name} (복사)`);
}

/** draft.listingId가 가리키는 매물. 정상 로드된 목록에 없으면(삭제됨) null로 본다. */
export function findDraftListing(
  snapshot: ListingListState,
  listingId: string | null,
): Listing | null {
  if (listingId === null || snapshot.status !== "ok") return null;
  return snapshot.listings.find((listing) => listing.id === listingId) ?? null;
}

/**
 * 입력값(금액 2개, 소재지, 보유 상태, 사용자 지정 LTV, 85㎡ 초과)이 저장본과 같은지. 이름은 비교하지 않는다.
 * 저장 버튼 상태와 저장 시트 안내가 모두 이 판단을 쓴다.
 * 사용자 지정 LTV는 키 없음을 null로 맞춰 정규화한 숫자로 비교한다("70%"와 70은 같다). 85㎡는 키 없음 = false다.
 */
export function isSameAsListing(input: LoanInput | null, listing: Listing): boolean {
  return (
    input !== null &&
    input.salePrice === listing.salePrice &&
    input.kbPrice === listing.kbPrice &&
    input.region === listing.region &&
    input.borrower === listing.borrower &&
    (input.customLtvRate ?? null) === (listing.customLtvRate ?? null) &&
    (input.isAreaOver85 === true) === (listing.isAreaOver85 === true)
  );
}

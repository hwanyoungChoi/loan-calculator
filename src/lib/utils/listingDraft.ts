import type { Draft } from "@/lib/types/draft";
import type { Listing, ListingSnapshot } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

/** 저장 매물을 열 때 draft를 통째로 바꿀 값(ADR-004) */
export function listingToDraft(listing: Listing): Draft {
  return {
    salePrice: String(listing.salePrice),
    kbPrice: String(listing.kbPrice),
    region: listing.region,
    borrower: listing.borrower,
    listingId: listing.id,
  };
}

/** draft.listingId가 가리키는 매물. 정상 로드된 목록에 없으면(삭제됨) null로 본다. */
export function findDraftListing(
  snapshot: ListingSnapshot,
  listingId: string | null,
): Listing | null {
  if (listingId === null || snapshot.status !== "ok") return null;
  return snapshot.listings.find((listing) => listing.id === listingId) ?? null;
}

/** 입력값(금액 2개, 소재지, 보유 상태)이 저장본과 같은지. 이름은 비교하지 않는다. */
export function isSameAsListing(input: LoanInput | null, listing: Listing): boolean {
  return (
    input !== null &&
    input.salePrice === listing.salePrice &&
    input.kbPrice === listing.kbPrice &&
    input.region === listing.region &&
    input.borrower === listing.borrower
  );
}

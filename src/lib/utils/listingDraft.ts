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
    customLtv: typeof listing.customLtvRate === "number" ? String(listing.customLtvRate) : null,
    isAreaOver85: listing.isAreaOver85 === true,
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

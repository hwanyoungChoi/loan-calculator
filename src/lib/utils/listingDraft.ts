import { LTV_PRESETS } from "@/lib/constants/draft";

import { createRandomId } from "./createRandomId";
import { isOneOf } from "./isOneOf";
import { truncateListingName } from "./validateListingName";

import type { Draft } from "@/lib/types/draft";
import type { ExtraCost } from "@/lib/types/extraCost";
import type { Listing, ListingListState } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

/**
 * 저장 매물을 열 때 draft를 통째로 바꿀 값(ADR-004). 사용자 지정 LTV가 칩 값(40·70·80)이 아니면 [직접 입력]으로 연다.
 * 추가 비용은 같은 순서의 줄로 옮긴다(줄 id는 새로 만든다). 키 없는 매물은 줄이 없다.
 */
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
    extraCosts: (listing.extraCosts ?? []).map(({ category, label, amount }) => ({
      id: createRandomId(),
      category,
      label,
      amount: String(amount),
    })),
  };
}

/** 매물 복사: 값(추가 비용 포함, 스펙 U5)은 그대로 채우되 매물 연결이 없는 새 매물로 연다. 원본은 바뀌지 않는다. */
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

function isSameExtraCosts(a: ExtraCost[], b: ExtraCost[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.category === b[index].category &&
        // 화면 값은 trim되어 오고, 서버는 원문을 그대로 받으므로 trim해서 비교한다.
        item.label.trim() === b[index].label.trim() &&
        item.amount === b[index].amount,
    )
  );
}

/**
 * 입력값(금액 2개, 소재지, 보유 상태, 사용자 지정 LTV, 85㎡ 초과, 추가 비용)이 저장본과 같은지. 이름은 비교하지 않는다.
 * 저장 버튼 상태와 저장 시트 안내가 모두 이 판단을 쓴다.
 * 사용자 지정 LTV는 키 없음을 null로 맞춰 정규화한 숫자로 비교한다("70%"와 70은 같다). 85㎡는 키 없음 = false다.
 * 추가 비용은 키 없음 = 빈 목록이다. 이 기능 전에 저장한 매물을 열기만 해도 "저장됨"이어야 한다(ADR-024 C1, AC-0).
 * 줄 수·순서·분류·이름·금액을 모두 본다.
 */
export function isSameAsListing(
  input: (LoanInput & { extraCosts?: ExtraCost[] }) | null,
  listing: Listing,
): boolean {
  return (
    input !== null &&
    input.salePrice === listing.salePrice &&
    input.kbPrice === listing.kbPrice &&
    input.region === listing.region &&
    input.borrower === listing.borrower &&
    (input.customLtvRate ?? null) === (listing.customLtvRate ?? null) &&
    (input.isAreaOver85 === true) === (listing.isAreaOver85 === true) &&
    isSameExtraCosts(input.extraCosts ?? [], listing.extraCosts ?? [])
  );
}

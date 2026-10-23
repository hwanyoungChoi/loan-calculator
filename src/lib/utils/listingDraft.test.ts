import { describe, expect, it } from "vitest";

import { makeListing } from "@/test/listingFixture";

import { findDraftListing, isSameAsListing, listingToDraft } from "./listingDraft";

import type { ListingSnapshot } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

const LISTING = makeListing({
  id: "a",
  salePrice: 125000,
  kbPrice: 120000,
  region: "regulated",
  borrower: "firstHome",
});

const OK: ListingSnapshot = { status: "ok", listings: [makeListing({ id: "other" }), LISTING] };

describe("listingToDraft (AC-7 카드 열기)", () => {
  it("매물 값과 listingId로 draft를 통째로 만든다", () => {
    expect(listingToDraft(LISTING)).toEqual({
      salePrice: "125000",
      kbPrice: "120000",
      region: "regulated",
      borrower: "firstHome",
      listingId: "a",
      customLtv: null,
      isCustomLtvInput: false,
      isAreaOver85: false,
      extraCosts: [],
    });
  });
});

describe("listingToDraft: 사용자 지정 LTV (AC-3e)", () => {
  it.each([70, 0, 100])(
    "customLtvRate %i인 매물을 열면 customLtv가 그 숫자의 문자열이다",
    (rate) => {
      expect(listingToDraft({ ...LISTING, customLtvRate: rate }).customLtv).toBe(String(rate));
    },
  );

  it("규제 매물(키 없음)을 열면 customLtv는 null(직접 입력 꺼짐)", () => {
    expect(Object.hasOwn(LISTING, "customLtvRate")).toBe(false);
    expect(listingToDraft(LISTING).customLtv).toBeNull();
  });
});

describe("findDraftListing (listingId가 목록에 없으면 null)", () => {
  it("정상 목록에 있으면 그 매물이다", () => {
    expect(findDraftListing(OK, "a")).toBe(LISTING);
  });

  it.each<[string, ListingSnapshot, string | null]>([
    ["listingId가 null", OK, null],
    ["삭제돼 목록에 없음", OK, "deleted"],
    ["빈 목록", { status: "ok", listings: [] }, "a"],
    ["목록 손상", { status: "corrupt", rawText: "{" }, "a"],
    ["저장소 접근 불가", { status: "unavailable" }, "a"],
  ])("%s → null", (_, snapshot, listingId) => {
    expect(findDraftListing(snapshot, listingId)).toBeNull();
  });
});

describe("isSameAsListing", () => {
  const same: LoanInput = {
    salePrice: 125000,
    kbPrice: 120000,
    region: "regulated",
    borrower: "firstHome",
  };

  it("금액 2개·소재지·보유 상태가 같으면 true(이름은 보지 않는다)", () => {
    expect(isSameAsListing(same, LISTING)).toBe(true);
    expect(isSameAsListing(same, { ...LISTING, name: "다른 이름" })).toBe(true);
  });

  it.each<[string, Partial<LoanInput>]>([
    ["매매가", { salePrice: 125001 }],
    ["KB시세", { kbPrice: 119999 }],
    ["소재지", { region: "nonCapital" }],
    ["보유 상태", { borrower: "noHome" }],
  ])("%s가 다르면 false", (_, patch) => {
    expect(isSameAsListing({ ...same, ...patch }, LISTING)).toBe(false);
  });

  it("입력이 유효하지 않으면(null) false", () => {
    expect(isSameAsListing(null, LISTING)).toBe(false);
  });

  it("사용자 지정 LTV: 키 없음끼리 같고, 같은 숫자끼리 같다(키 없음 ≡ null)", () => {
    expect(isSameAsListing(same, LISTING)).toBe(true);
    expect(isSameAsListing({ ...same, customLtvRate: undefined }, LISTING)).toBe(true);
    expect(isSameAsListing({ ...same, customLtvRate: 70 }, { ...LISTING, customLtvRate: 70 })).toBe(
      true,
    );
  });

  it.each<[string, number | undefined, number | undefined]>([
    ["입력만 사용자 지정", 70, undefined],
    ["저장본만 사용자 지정", undefined, 70],
    ["값이 다름", 70, 71],
    ["0과 키 없음은 다르다", 0, undefined],
    ["키 없음과 0은 다르다", undefined, 0],
  ])("사용자 지정 LTV %s → false", (_, inputRate, listingRate) => {
    const input: LoanInput = inputRate === undefined ? same : { ...same, customLtvRate: inputRate };
    const listing =
      listingRate === undefined ? LISTING : { ...LISTING, customLtvRate: listingRate };
    expect(isSameAsListing(input, listing)).toBe(false);
  });
});

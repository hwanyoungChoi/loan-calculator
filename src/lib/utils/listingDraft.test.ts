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
    });
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
});

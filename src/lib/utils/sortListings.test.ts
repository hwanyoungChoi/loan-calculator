import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { makeListing, withUnconfirmedCell } from "@/test/listingFixture";

import { calculateLoan } from "./calculateLoan";
import { sortListings } from "./sortListings";

import type { Listing } from "@/lib/types/listing";

function ids(listings: Listing[]): string[] {
  return listings.map((listing) => listing.id);
}

function day(n: number): string {
  return `2026-10-${String(n).padStart(2, "0")}T00:00:00.000Z`;
}

// 운영 규제 기준 자기자금(만원). 규제지역·무주택 40%, 15억 이하 상한 6억.
const OWN_60000 = makeListing({ id: "own-60000", salePrice: 100000, kbPrice: 100000 });
const OWN_80000 = makeListing({ id: "own-80000", salePrice: 120000, kbPrice: 100000 });
const OWN_30000 = makeListing({ id: "own-30000", salePrice: 50000, kbPrice: 50000 });
// 확인된 LTV 0%(규제지역·1주택 미처분): 자기자금 = 매매가 전액 70000
const ZERO_LTV = makeListing({
  id: "zero-ltv",
  salePrice: 70000,
  kbPrice: 70000,
  borrower: "oneHomeKeep",
});

describe("sortListings: 자기자금순 (AC-7)", () => {
  it("전제: fixture의 자기자금이 의도한 값이다", () => {
    expect(calculateLoan(OWN_30000, LOAN_REGULATIONS).ownFunds).toBe(30000);
    expect(calculateLoan(OWN_60000, LOAN_REGULATIONS).ownFunds).toBe(60000);
    expect(calculateLoan(ZERO_LTV, LOAN_REGULATIONS)).toMatchObject({
      status: "ok",
      loanLimit: 0,
      ownFunds: 70000,
    });
    expect(calculateLoan(OWN_80000, LOAN_REGULATIONS).ownFunds).toBe(80000);
  });

  it("자기자금 오름차순이다", () => {
    const sorted = sortListings([OWN_80000, OWN_30000, OWN_60000], "ownFunds", LOAN_REGULATIONS);
    expect(ids(sorted)).toEqual(["own-30000", "own-60000", "own-80000"]);
  });

  it("확인된 LTV 0% 매물은 미확인으로 취급하지 않고 자기자금(매매가 전액) 위치에 정렬된다", () => {
    const sorted = sortListings(
      [OWN_80000, ZERO_LTV, OWN_30000, OWN_60000],
      "ownFunds",
      LOAN_REGULATIONS,
    );
    expect(ids(sorted)).toEqual(["own-30000", "own-60000", "zero-ltv", "own-80000"]);
  });

  it("자기자금이 같으면 createdAt 내림차순, 그래도 같으면 입력 순서다", () => {
    // 모두 자기자금 30000: 규제지역·무주택 50000/50000, 비수도권·무주택(70%) 100000/100000
    const listings = [
      makeListing({ id: "old", salePrice: 50000, kbPrice: 50000, createdAt: day(1) }),
      makeListing({
        id: "newest",
        salePrice: 100000,
        kbPrice: 100000,
        region: "nonCapital",
        createdAt: day(5),
      }),
      makeListing({ id: "mid-first", salePrice: 50000, kbPrice: 50000, createdAt: day(3) }),
      makeListing({ id: "mid-second", salePrice: 50000, kbPrice: 50000, createdAt: day(3) }),
    ];
    for (const listing of listings) {
      expect(calculateLoan(listing, LOAN_REGULATIONS).ownFunds).toBe(30000);
    }

    expect(ids(sortListings(listings, "ownFunds", LOAN_REGULATIONS))).toEqual([
      "newest",
      "mid-first",
      "mid-second",
      "old",
    ]);
  });

  it("동률 판정은 createdAt이고 updatedAt은 보지 않는다", () => {
    const listings = [
      makeListing({ id: "created-old", createdAt: day(1), updatedAt: day(20) }),
      makeListing({ id: "created-new", createdAt: day(2), updatedAt: day(2) }),
    ];
    expect(ids(sortListings(listings, "ownFunds", LOAN_REGULATIONS))).toEqual([
      "created-new",
      "created-old",
    ]);
  });

  describe("미확인 매물 (규제 fixture 주입)", () => {
    // 수도권 비규제·무주택만 미확인. 원래 70%라면 자기자금 3000으로 가장 작았을 매물들이다.
    const regulations = withUnconfirmedCell("capitalNonRegulated", "noHome");
    const unconfirmedOld = makeListing({
      id: "unconfirmed-old",
      salePrice: 10000,
      kbPrice: 10000,
      region: "capitalNonRegulated",
      createdAt: day(1),
      updatedAt: day(30),
    });
    const unconfirmedNew = makeListing({
      id: "unconfirmed-new",
      salePrice: 10000,
      kbPrice: 10000,
      region: "capitalNonRegulated",
      createdAt: day(9),
      updatedAt: day(9),
    });
    const unconfirmedMid = makeListing({
      id: "unconfirmed-mid",
      salePrice: 900000,
      kbPrice: 900000,
      region: "capitalNonRegulated",
      createdAt: day(5),
    });

    it("전제: fixture 매물은 unconfirmed이고 운영 규제에서는 자기자금이 가장 작다", () => {
      expect(calculateLoan(unconfirmedOld, regulations).status).toBe("unconfirmed");
      expect(calculateLoan(unconfirmedOld, LOAN_REGULATIONS).ownFunds).toBe(3000);
      expect(calculateLoan(ZERO_LTV, regulations).status).toBe("ok");
    });

    it("맨 뒤로 가고, 미확인끼리는 createdAt 내림차순이다. 0% 매물은 그 앞 정상 위치다", () => {
      const sorted = sortListings(
        [unconfirmedOld, OWN_80000, unconfirmedMid, ZERO_LTV, unconfirmedNew, OWN_30000],
        "ownFunds",
        regulations,
      );
      expect(ids(sorted)).toEqual([
        "own-30000",
        "zero-ltv",
        "own-80000",
        "unconfirmed-new",
        "unconfirmed-mid",
        "unconfirmed-old",
      ]);
    });

    it("결과는 인자로 받은 규제로 다시 계산한 값 기준이다(ADR-007)", () => {
      const listings = [OWN_30000, unconfirmedOld];
      expect(ids(sortListings(listings, "ownFunds", LOAN_REGULATIONS))).toEqual([
        "unconfirmed-old",
        "own-30000",
      ]);
      expect(ids(sortListings(listings, "ownFunds", regulations))).toEqual([
        "own-30000",
        "unconfirmed-old",
      ]);
    });

    it("최근 저장순에서는 미확인도 updatedAt 순서 그대로다", () => {
      const sorted = sortListings(
        [OWN_30000, unconfirmedNew, unconfirmedOld],
        "recent",
        regulations,
      );
      // OWN_30000.updatedAt = 10-01, unconfirmedNew = 10-09, unconfirmedOld = 10-30
      expect(ids(sorted)).toEqual(["unconfirmed-old", "unconfirmed-new", "own-30000"]);
    });
  });

  it("삭제 후 남은 목록도 같은 규칙으로 정렬된다", () => {
    const listings = [OWN_80000, ZERO_LTV, OWN_30000, OWN_60000];
    const afterDelete = listings.filter((listing) => listing.id !== "own-60000");
    expect(ids(sortListings(afterDelete, "ownFunds", LOAN_REGULATIONS))).toEqual([
      "own-30000",
      "zero-ltv",
      "own-80000",
    ]);
  });
});

describe("sortListings: 최근 저장순 (AC-7)", () => {
  it("updatedAt 내림차순이다(createdAt·자기자금과 무관)", () => {
    const listings = [
      makeListing({ id: "a", createdAt: day(9), updatedAt: day(9) }),
      makeListing({ id: "b", createdAt: day(1), updatedAt: day(20), salePrice: 999999 }),
      makeListing({ id: "c", createdAt: day(5), updatedAt: day(10) }),
    ];
    expect(ids(sortListings(listings, "recent", LOAN_REGULATIONS))).toEqual(["b", "c", "a"]);
  });

  it("updatedAt이 같으면 입력 순서다", () => {
    const listings = [
      makeListing({ id: "first", updatedAt: day(3) }),
      makeListing({ id: "second", updatedAt: day(3) }),
    ];
    expect(ids(sortListings(listings, "recent", LOAN_REGULATIONS))).toEqual(["first", "second"]);
  });
});

it("입력 배열을 바꾸지 않는다", () => {
  const listings = [OWN_80000, OWN_30000];
  sortListings(listings, "ownFunds", LOAN_REGULATIONS);
  sortListings(listings, "recent", LOAN_REGULATIONS);
  expect(ids(listings)).toEqual(["own-80000", "own-30000"]);
});

// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { loadListings } from "@/lib/utils/listingStorage";
import { makeListing } from "@/test/listingFixture";
import { createMemoryStorage } from "@/test/memoryStorage";

import ListingCard from "./ListingCard";

import type { Listing } from "@/lib/types/listing";

/**
 * 1차 배포가 저장한 형식 그대로의 원문(AC-3a). customLtvRate 키가 없고 borrower 4값이 하나씩이다.
 * 제품 코드의 상수·fixture로 만들지 않는다. 저장 키와 형식이 바뀌면 기존 사용자 목록이 깨지므로 이 문자열이 지킨다.
 * 기대 자기자금은 1차 규칙(규제 LTV, 담보 min, 상한 max 기준)으로 손으로 계산한 값이다.
 */
const LEGACY_STORAGE_KEY = "loan-calculator/listings";
const LEGACY_LISTINGS_JSON =
  "[" +
  // 규제지역·무주택 100000/100000: 40% → 40000, 상한 60000 → 한도 40000, 자기자금 60000 + 부대비용 3800
  '{"id":"legacy-a","name":"래미안 101동","salePrice":100000,"kbPrice":100000,"region":"regulated","borrower":"noHome","createdAt":"2026-10-01T00:00:00.000Z","updatedAt":"2026-10-01T00:00:00.000Z"},' +
  // 규제지역·생애최초 125000/120000: 120000 × 70% = 84000, 상한 60000 → 한도 60000, 자기자금 65000 + 4875
  '{"id":"legacy-b","name":"자이 3단지","salePrice":125000,"kbPrice":120000,"region":"regulated","borrower":"firstHome","createdAt":"2026-10-02T09:30:00+09:00","updatedAt":"2026-10-03T00:00:00Z"},' +
  // 수도권 비규제·1주택 처분조건부 90000/85000: 85000 × 70% = 59500, 상한 60000 → 한도 59500, 자기자금 30500 + 3420
  '{"id":"legacy-c","name":"힐스테이트","salePrice":90000,"kbPrice":85000,"region":"capitalNonRegulated","borrower":"oneHomeDisposal","createdAt":"2026-10-03T00:00:00.000Z","updatedAt":"2026-10-03T00:00:00.000Z"},' +
  // 비수도권·1주택 미처분 50000/48000: 48000 × 60% = 28800, 상한 없음 → 한도 28800, 자기자금 21200 + 750(비조정이라 중과 아님)
  '{"id":"legacy-d","name":"e편한세상","salePrice":50000,"kbPrice":48000,"region":"nonCapital","borrower":"oneHomeKeep","createdAt":"2026-10-04T00:00:00.000Z","updatedAt":"2026-10-04T00:00:00.000Z"}' +
  "]";

const LEGACY_EXPECTED: Record<string, { loanLimit: number; ownFunds: number }> = {
  "legacy-a": { loanLimit: 40000, ownFunds: 63800 },
  "legacy-b": { loanLimit: 60000, ownFunds: 69875 },
  "legacy-c": { loanLimit: 59500, ownFunds: 33920 },
  "legacy-d": { loanLimit: 28800, ownFunds: 21950 },
};

function loadLegacy(): Listing[] {
  const result = loadListings(createMemoryStorage({ [LEGACY_STORAGE_KEY]: LEGACY_LISTINGS_JSON }));
  if (!result.ok) throw new Error(`1차 형식을 읽지 못함: ${JSON.stringify(result)}`);
  return result.listings;
}

function renderCards(listings: Listing[]) {
  return render(
    <ul>
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard
            listing={listing}
            regulations={LOAN_REGULATIONS}
            onOpen={() => {}}
            budget={null}
            onCopy={() => {}}
            onDelete={() => {}}
            onShare={() => {}}
            onSaveMemo={async () => ({ ok: true })}
            onSaveName={async () => ({ ok: true })}
            onStatusOpen={() => {}}
            statusFailure={null}
            isPrivacyMode={false}
            revealedId={null}
            onRevealChange={() => {}}
          />
        </li>
      ))}
    </ul>,
  );
}

function cardOf(name: string): HTMLElement {
  const item = screen
    .getAllByRole("listitem")
    .find((element) => within(element).queryByText(name, { selector: "strong" }) !== null);
  if (item === undefined) throw new Error(`카드 없음: ${name}`);
  return item;
}

/** 카드에서 라벨(dt) 옆의 값 */
function figure(card: HTMLElement, label: string): string {
  return (
    within(card).getByText(label, { selector: "dt" }).parentElement?.querySelector("dd")
      ?.textContent ?? ""
  );
}

describe("1차 형식 저장 목록 회귀 (AC-3a)", () => {
  it("고정 원문을 loadListings가 ok로 읽고, 매물에 customLtvRate 키가 생기지 않는다", () => {
    const listings = loadLegacy();
    expect(listings.map((listing) => listing.borrower)).toEqual([
      "noHome",
      "firstHome",
      "oneHomeDisposal",
      "oneHomeKeep",
    ]);
    for (const listing of listings) {
      expect(Object.hasOwn(listing, "customLtvRate")).toBe(false);
    }
  });

  it("읽은 매물을 calculateLoan에 그대로 넘기면 규제 LTV로 계산되고 자기자금이 1차 값과 같다", () => {
    for (const listing of loadLegacy()) {
      const result = calculateLoan(listing, LOAN_REGULATIONS);
      expect(result.status).toBe("ok");
      expect(result.appliedLtv?.source).toBe("regulation");
      expect({ loanLimit: result.loanLimit, ownFunds: result.ownFunds }).toEqual(
        LEGACY_EXPECTED[listing.id],
      );
    }
  });

  it("키 없는 매물을 ListingCard에 넣어도 규제 LTV로 계산되고 '사용자 지정' 배지가 없다", () => {
    const listings = loadLegacy().slice(0, 3);
    renderCards(listings);

    expect(figure(cardOf("래미안 101동"), "필요한 자기자금")).toBe("6억 3,800만원");
    expect(figure(cardOf("래미안 101동"), "예상 한도")).toBe("4억원");
    expect(figure(cardOf("자이 3단지"), "필요한 자기자금")).toBe("6억 9,875만원");
    expect(figure(cardOf("힐스테이트"), "필요한 자기자금")).toBe("3억 3,920만원");
    expect(within(cardOf("래미안 101동")).getByText("규제지역 · 무주택")).toBeInTheDocument();
    expect(screen.queryByText("사용자 지정")).not.toBeInTheDocument();
    expect(screen.queryByText(/계산 불가/)).not.toBeInTheDocument();
  });
});

describe("ListingCard 표시 (AC-3, 화면 3)", () => {
  it("사용자 지정 LTV 매물: 조건 요약에 '사용자 지정 LTV 70%', '사용자 지정' 배지, 자기 값으로 계산", () => {
    renderCards([
      makeListing({
        name: "사용자 지정 매물",
        salePrice: 100000,
        kbPrice: 100000,
        customLtvRate: 70,
      }),
    ]);
    const card = cardOf("사용자 지정 매물");
    expect(within(card).getByText("규제지역 · 무주택 · 사용자 지정 LTV 70%")).toBeInTheDocument();
    expect(within(card).getByText("사용자 지정")).toBeInTheDocument();
    // 70000 → 상한 60000
    expect(figure(card, "예상 한도")).toBe("6억원");
    expect(figure(card, "필요한 자기자금")).toBe("4억 3,800만원");
  });

  it("ineligible 매물: '계산 불가 · 요건 미충족' 배지와 —", () => {
    renderCards([
      makeListing({
        name: "8억 초과",
        salePrice: 85000,
        kbPrice: 84000,
        borrower: "noHomePreferred",
      }),
    ]);
    const card = cardOf("8억 초과");
    expect(within(card).getByText("계산 불가 · 요건 미충족")).toBeInTheDocument();
    expect(figure(card, "예상 한도")).toBe("—");
    expect(figure(card, "필요한 자기자금")).toBe("—");
    expect(within(card).queryByText("사용자 지정")).not.toBeInTheDocument();
  });

  it("사용자 지정 0%는 한도 0만원(— 아님)", () => {
    renderCards([
      makeListing({ name: "영퍼센트", salePrice: 100000, kbPrice: 100000, customLtvRate: 0 }),
    ]);
    const card = cardOf("영퍼센트");
    expect(figure(card, "예상 한도")).toBe("0만원");
    expect(figure(card, "필요한 자기자금")).toBe("10억 3,800만원");
  });
});

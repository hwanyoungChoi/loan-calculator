import { describe, expect, it, vi } from "vitest";

import { makeListing } from "@/test/listingFixture";
import { createMemoryStorage } from "@/test/memoryStorage";

import { LISTINGS_STORAGE_KEY, loadListings, parseListings, saveListings } from "./listingStorage";

import type { Listing } from "@/lib/types/listing";

/** 유효한 매물 하나의 필드를 바꾸거나(값) 지운(undefined) 원문 */
function rawWith(patch: Record<string, unknown>): string {
  const listing: Record<string, unknown> = { ...makeListing(), ...patch };
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) delete listing[key];
  }
  return JSON.stringify([listing]);
}

function throwingStorage(method: "getItem" | "setItem"): Storage {
  const storage = createMemoryStorage();
  vi.spyOn(storage, method).mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });
  return storage;
}

describe("저장 키", () => {
  it("목록은 loan-calculator/listings 키에 배열 JSON으로 저장한다(키가 바뀌면 기존 사용자 목록이 사라진다)", () => {
    const storage = createMemoryStorage();
    const listings = [makeListing()];

    expect(LISTINGS_STORAGE_KEY).toBe("loan-calculator/listings");
    expect(saveListings(storage, listings)).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem("loan-calculator/listings") ?? "")).toEqual(listings);
  });
});

describe("loadListings / saveListings 왕복 (AC-6a)", () => {
  it("저장한 목록을 같은 Storage에서 그대로 다시 읽는다", () => {
    const storage = createMemoryStorage();
    const listings: Listing[] = [
      makeListing({ id: "a", name: "래미안 101동" }),
      makeListing({
        id: "b",
        name: "🏠 자이 3단지",
        salePrice: 999999999,
        kbPrice: 1,
        region: "nonCapital",
        borrower: "oneHomeKeep",
        createdAt: "2026-10-20T09:30:00+09:00",
        updatedAt: "2026-10-21T00:00:00Z",
      }),
    ];

    saveListings(storage, listings);

    expect(loadListings(storage)).toEqual({ ok: true, listings });
  });

  it("빈 배열을 저장하면 빈 목록 ok다", () => {
    const storage = createMemoryStorage();
    saveListings(storage, []);
    expect(loadListings(storage)).toEqual({ ok: true, listings: [] });
  });

  it("키가 없으면(getItem이 null) 손상이 아니라 빈 목록 ok다", () => {
    expect(loadListings(createMemoryStorage())).toEqual({ ok: true, listings: [] });
    expect(parseListings(null)).toEqual({ ok: true, listings: [] });
  });
});

describe("손상 판정은 전체 단위다 (AC-6c)", () => {
  const corruptCases: [string, string][] = [
    ["빈 문자열", ""],
    ["잘못된 JSON", "{"],
    ["JSON이 아닌 텍스트", "not json"],
    ["JSON null", "null"],
    ["객체(배열 아님)", JSON.stringify({ listings: [makeListing()] })],
    ["숫자(배열 아님)", "42"],
    ["문자열(배열 아님)", JSON.stringify("[]")],
    ["요소가 null", "[null]"],
    ["요소가 배열", "[[]]"],
    ["요소가 문자열", '["listing"]'],
    // id
    ["id 누락", rawWith({ id: undefined })],
    ["빈 id", rawWith({ id: "" })],
    ["id가 숫자", rawWith({ id: 1 })],
    // name
    ["name 누락", rawWith({ name: undefined })],
    ["name이 숫자", rawWith({ name: 101 })],
    ["name이 빈 문자열", rawWith({ name: "" })],
    ["name 41자", rawWith({ name: "가".repeat(41) })],
    ["name 41자(이모지, 코드포인트 기준)", rawWith({ name: "😀".repeat(41) })],
    // 가격
    ["salePrice 누락", rawWith({ salePrice: undefined })],
    ["salePrice 0", rawWith({ salePrice: 0 })],
    ["salePrice 음수", rawWith({ salePrice: -1 })],
    ["salePrice 소수", rawWith({ salePrice: 1.5 })],
    ["salePrice 문자열", rawWith({ salePrice: "125000" })],
    ["salePrice 최대 초과(10자리)", rawWith({ salePrice: 1000000000 })],
    ["salePrice null", rawWith({ salePrice: null })],
    ["kbPrice 누락", rawWith({ kbPrice: undefined })],
    ["kbPrice 0", rawWith({ kbPrice: 0 })],
    ["kbPrice 음수", rawWith({ kbPrice: -120000 })],
    ["kbPrice 소수", rawWith({ kbPrice: 120000.5 })],
    ["kbPrice 최대 초과(10자리)", rawWith({ kbPrice: 1000000000 })],
    // enum
    ["region 누락", rawWith({ region: undefined })],
    ["region enum 오류", rawWith({ region: "seoul" })],
    ["borrower 누락", rawWith({ borrower: undefined })],
    ["borrower enum 오류", rawWith({ borrower: "multiHome" })],
    ["borrower 타입 오류", rawWith({ borrower: 1 })],
    // 시각
    ["createdAt 누락", rawWith({ createdAt: undefined })],
    ["createdAt 날짜 아님", rawWith({ createdAt: "어제" })],
    ["createdAt 숫자(epoch)", rawWith({ createdAt: 1760000000000 })],
    ["createdAt 실존하지 않는 날짜", rawWith({ createdAt: "2026-02-30T00:00:00.000Z" })],
    ["updatedAt 누락", rawWith({ updatedAt: undefined })],
    ["updatedAt 날짜 아님", rawWith({ updatedAt: "not-a-date" })],
  ];

  it.each(corruptCases)("%s → corrupt, 원문을 그대로 돌려준다", (_, rawText) => {
    const storage = createMemoryStorage({ [LISTINGS_STORAGE_KEY]: rawText });

    expect(loadListings(storage)).toEqual({ ok: false, reason: "corrupt", rawText });
    expect(parseListings(rawText)).toEqual({ ok: false, reason: "corrupt", rawText });
  });

  it("정상 항목 사이에 손상 항목이 하나만 있어도 항목을 골라 버리지 않고 전체가 corrupt다", () => {
    const rawText = JSON.stringify([
      makeListing({ id: "a" }),
      { ...makeListing({ id: "b" }), salePrice: 0 },
      makeListing({ id: "c" }),
    ]);

    expect(parseListings(rawText)).toEqual({ ok: false, reason: "corrupt", rawText });
  });

  const validCases: [string, Listing][] = [
    ["name 1자", makeListing({ name: "a" })],
    ["name 40자", makeListing({ name: "가".repeat(40) })],
    ["name 이모지 40자(UTF-16 80단위)", makeListing({ name: "😀".repeat(40) })],
    ["가격 1과 최대 999,999,999", makeListing({ salePrice: 1, kbPrice: 999999999 })],
    ["시각에 오프셋", makeListing({ createdAt: "2026-10-21T09:00:00+09:00" })],
    ["윤년 2월 29일", makeListing({ createdAt: "2028-02-29T00:00:00.000Z" })],
  ];

  it.each(validCases)("경계 안쪽(%s)은 정상 목록이다", (_, listing) => {
    expect(parseListings(JSON.stringify([listing]))).toEqual({ ok: true, listings: [listing] });
  });

  it("region 3개 × borrower 5개 값은 모두 정상이다", () => {
    const regions = ["regulated", "capitalNonRegulated", "nonCapital"] as const;
    const borrowers = [
      "noHome",
      "firstHome",
      "noHomePreferred",
      "oneHomeDisposal",
      "oneHomeKeep",
    ] as const;
    const listings = regions.flatMap((region) =>
      borrowers.map((borrower) => makeListing({ id: `${region}-${borrower}`, region, borrower })),
    );

    expect(parseListings(JSON.stringify(listings))).toEqual({ ok: true, listings });
  });
});

describe("선택 필드 customLtvRate 검증 (AC-3c, ADR-012)", () => {
  // 키가 있으면 typeof === "number" → 정수 → 0~100. 하나라도 아니면 목록 전체가 corrupt다.
  const corruptCases: [string, string][] = [
    ["null", rawWith({ customLtvRate: null })],
    ['문자열 "70"', rawWith({ customLtvRate: "70" })],
    ['문자열 "0"', rawWith({ customLtvRate: "0" })],
    ["빈 문자열", rawWith({ customLtvRate: "" })],
    ["true", rawWith({ customLtvRate: true })],
    ["false", rawWith({ customLtvRate: false })],
    ["빈 배열", rawWith({ customLtvRate: [] })],
    ["빈 객체", rawWith({ customLtvRate: {} })],
    ["소수 70.5", rawWith({ customLtvRate: 70.5 })],
    ["101", rawWith({ customLtvRate: 101 })],
    ["-1", rawWith({ customLtvRate: -1 })],
    ["borrower 정해진 값 아님(서민실수요자 철자 오류)", rawWith({ borrower: "noHomePreffered" })],
  ];

  it.each(corruptCases)("customLtvRate %s → 목록 전체 corrupt", (_, rawText) => {
    expect(parseListings(rawText)).toEqual({ ok: false, reason: "corrupt", rawText });
  });

  it("정상 매물 사이에 customLtvRate가 틀린 매물이 하나만 있어도 전체가 corrupt다", () => {
    const rawText = JSON.stringify([
      makeListing({ id: "a" }),
      { ...makeListing({ id: "b" }), customLtvRate: "70" },
      makeListing({ id: "c", customLtvRate: 70 }),
    ]);
    expect(parseListings(rawText)).toEqual({ ok: false, reason: "corrupt", rawText });
  });

  it.each([0, 1, 70, 99, 100])(
    "customLtvRate %i는 정상이고 값이 그대로 읽힌다",
    (customLtvRate) => {
      const listing = makeListing({ customLtvRate });
      expect(parseListings(JSON.stringify([listing]))).toEqual({ ok: true, listings: [listing] });
    },
  );

  it("JSON 원문의 100.0은 숫자 100이라 정상이다", () => {
    const rawText = JSON.stringify([makeListing()]).replace(
      '"borrower":"noHome"',
      '"borrower":"noHome","customLtvRate":100.0',
    );
    expect(rawText).toContain('"customLtvRate":100.0');
    expect(parseListings(rawText)).toEqual({
      ok: true,
      listings: [makeListing({ customLtvRate: 100 })],
    });
  });

  it("키가 없으면 정상이고, 읽은 매물에도 키가 생기지 않는다", () => {
    const result = parseListings(JSON.stringify([makeListing()]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.hasOwn(result.listings[0], "customLtvRate")).toBe(false);
  });

  it("borrower noHomePreferred와 customLtvRate를 함께 저장하고 다시 읽는다", () => {
    const storage = createMemoryStorage();
    const listings = [makeListing({ borrower: "noHomePreferred", customLtvRate: 60 })];
    saveListings(storage, listings);
    expect(loadListings(storage)).toEqual({ ok: true, listings });
  });
});

describe("접근 불가 (AC-6e)", () => {
  it("getItem이 throw하면 unavailable이다(시크릿 모드·차단)", () => {
    expect(loadListings(throwingStorage("getItem"))).toEqual({ ok: false, reason: "unavailable" });
  });

  it("setItem이 throw하면 unavailable이다(용량 초과)", () => {
    expect(saveListings(throwingStorage("setItem"), [makeListing()])).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import { createMemoryStorage } from "@/test/memoryStorage";

import {
  createDraftStore,
  DRAFT_STORAGE_KEY,
  loadDraft,
  parseDraft,
  saveDraft,
} from "./draftStorage";

import type { Draft } from "@/lib/types/draft";

const DEFAULT: Draft = {
  salePrice: "",
  kbPrice: "",
  region: "regulated",
  borrower: "noHome",
  listingId: null,
  customLtv: null,
};

const VALID: Draft = {
  salePrice: "125000",
  kbPrice: "120000",
  region: "nonCapital",
  borrower: "firstHome",
  listingId: "listing-1",
  customLtv: null,
};

/** 유효한 draft의 필드를 바꾸거나(값) 지운(undefined) 원문 */
function rawWith(patch: Record<string, unknown>): string {
  const draft: Record<string, unknown> = { ...VALID, ...patch };
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) delete draft[key];
  }
  return JSON.stringify(draft);
}

function throwing(storage: Storage, method: "getItem" | "setItem") {
  vi.spyOn(storage, method).mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });
  return storage;
}

describe("parseDraft (AC-8d)", () => {
  it("정상 원문을 그대로 읽는다", () => {
    expect(parseDraft(JSON.stringify(VALID))).toEqual(VALID);
    expect(parseDraft(JSON.stringify({ ...VALID, listingId: null }))).toEqual({
      ...VALID,
      listingId: null,
    });
  });

  it("customLtv가 입력 중인 문자열(빈 값·오류 포함)이면 그대로 읽는다", () => {
    for (const customLtv of ["70", "", "70.5"]) {
      expect(parseDraft(rawWith({ customLtv }))).toEqual({ ...VALID, customLtv });
    }
  });

  it("1차 형식 draft(customLtv 키 없음)는 금액·조건까지 모두 기본값으로 바뀐다", () => {
    const legacy =
      '{"salePrice":"125000","kbPrice":"120000","region":"nonCapital","borrower":"firstHome","listingId":"listing-1"}';
    expect(parseDraft(legacy)).toEqual(DEFAULT);
  });

  it("잘못 입력 중인 금액 문자열도 그대로 남긴다(새로고침 후 유지)", () => {
    const draft: Draft = { ...VALID, salePrice: "12a", kbPrice: "0" };
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it("키 없음(null)은 기본 draft다: 규제지역·무주택, 금액 빈 값, listingId null", () => {
    expect(parseDraft(null)).toEqual(DEFAULT);
  });

  const corruptCases: [string, unknown][] = [
    ["JSON 아님", "{"],
    ["빈 문자열", ""],
    ["JSON null", "null"],
    ["배열", "[]"],
    ["숫자", "42"],
    ["문자열이 아닌 원문(객체)", { ...VALID }],
    ["문자열이 아닌 원문(undefined)", undefined],
    ["salePrice 누락", rawWith({ salePrice: undefined })],
    ["kbPrice 누락", rawWith({ kbPrice: undefined })],
    ["region 누락", rawWith({ region: undefined })],
    ["borrower 누락", rawWith({ borrower: undefined })],
    ["listingId 누락", rawWith({ listingId: undefined })],
    ["salePrice가 숫자", rawWith({ salePrice: 125000 })],
    ["kbPrice가 null", rawWith({ kbPrice: null })],
    ["region enum 오류", rawWith({ region: "seoul" })],
    ["borrower enum 오류", rawWith({ borrower: "multiHome" })],
    ["listingId가 숫자", rawWith({ listingId: 1 })],
    ["listingId가 객체", rawWith({ listingId: { id: "a" } })],
    ["listingId가 false", rawWith({ listingId: false })],
    // customLtv (AC-3e): 1차 draft처럼 키가 없거나 타입이 틀리면 기본값
    ["customLtv 누락(1차 draft)", rawWith({ customLtv: undefined })],
    ["customLtv가 숫자", rawWith({ customLtv: 70 })],
    ["customLtv가 false", rawWith({ customLtv: false })],
    ["customLtv가 배열", rawWith({ customLtv: ["70"] })],
  ];

  it.each(corruptCases)("%s → throw 없이 기본 draft", (_, raw) => {
    expect(() => parseDraft(raw)).not.toThrow();
    expect(parseDraft(raw)).toEqual(DEFAULT);
  });

  it("일부만 깨져도 맞는 필드를 섞지 않고 전체를 기본값으로 바꾼다", () => {
    // region은 유효하지만 borrower가 깨졌다 → region도 기본값
    expect(parseDraft(rawWith({ region: "nonCapital", borrower: "x" }))).toEqual(DEFAULT);
  });
});

describe("loadDraft / saveDraft", () => {
  it("draft는 loan-calculator/draft 키에 저장하고 같은 Storage에서 다시 읽는다", () => {
    const storage = createMemoryStorage();

    expect(DRAFT_STORAGE_KEY).toBe("loan-calculator/draft");
    expect(saveDraft(storage, VALID)).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem("loan-calculator/draft") ?? "")).toEqual(VALID);
    expect(loadDraft(storage)).toEqual(VALID);
  });

  it("키가 없거나 손상이면 기본 draft다", () => {
    expect(loadDraft(createMemoryStorage())).toEqual(DEFAULT);
    expect(loadDraft(createMemoryStorage({ [DRAFT_STORAGE_KEY]: "{" }))).toEqual(DEFAULT);
  });

  it("getItem이 throw해도 throw하지 않고 기본 draft다", () => {
    const storage = throwing(createMemoryStorage({ [DRAFT_STORAGE_KEY]: "{}" }), "getItem");
    expect(loadDraft(storage)).toEqual(DEFAULT);
  });

  it("setItem이 throw하면 unavailable을 돌려주고 throw하지 않는다", () => {
    const storage = throwing(createMemoryStorage(), "setItem");
    expect(saveDraft(storage, VALID)).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("createDraftStore", () => {
  it("update는 부분 변경을 합치고, 같은 Storage로 다시 만들면(새로고침) 값과 조건이 남는다", () => {
    const storage = createMemoryStorage();
    const store = createDraftStore({ storage });
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.getSnapshot()).toEqual(DEFAULT);
    store.update({ salePrice: "125000" });
    store.update({ kbPrice: "12a", region: "capitalNonRegulated", borrower: "oneHomeDisposal" });

    const expected: Draft = {
      salePrice: "125000",
      kbPrice: "12a",
      region: "capitalNonRegulated",
      borrower: "oneHomeDisposal",
      listingId: null,
      customLtv: null,
    };
    expect(store.getSnapshot()).toEqual(expected);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(createDraftStore({ storage }).getSnapshot()).toEqual(expected);
  });

  it("변경이 없으면 같은 참조를 돌려준다", () => {
    const store = createDraftStore({ storage: createMemoryStorage() });
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("clear는 기본 draft로 되돌리고 저장한다", () => {
    const storage = createMemoryStorage({ [DRAFT_STORAGE_KEY]: JSON.stringify(VALID) });
    const store = createDraftStore({ storage });
    expect(store.getSnapshot()).toEqual(VALID);

    store.clear();

    expect(store.getSnapshot()).toEqual(DEFAULT);
    expect(createDraftStore({ storage }).getSnapshot()).toEqual(DEFAULT);
  });

  it("손상된 draft로 시작해도 기본값으로 조용히 시작한다", () => {
    const storage = createMemoryStorage({ [DRAFT_STORAGE_KEY]: "{" });
    expect(createDraftStore({ storage }).getSnapshot()).toEqual(DEFAULT);
  });

  it("저장소 접근이 불가능해도 메모리로 동작한다", () => {
    const storage = throwing(throwing(createMemoryStorage(), "getItem"), "setItem");
    const store = createDraftStore({ storage });
    const listener = vi.fn();
    store.subscribe(listener);

    expect(() => store.update({ salePrice: "125000" })).not.toThrow();

    expect(store.getSnapshot()).toEqual({ ...DEFAULT, salePrice: "125000" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

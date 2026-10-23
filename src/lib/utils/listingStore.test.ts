import { describe, expect, it, vi } from "vitest";

import { makeListing } from "@/test/listingFixture";
import { createMemoryStorage } from "@/test/memoryStorage";

import { LISTINGS_STORAGE_KEY } from "./listingStorage";
import { createListingStore } from "./listingStore";
import { toLoanInput } from "./toLoanInput";

import type { ListingInput } from "@/lib/types/listing";

const INPUT: ListingInput = {
  name: "래미안 101동",
  salePrice: 125000,
  kbPrice: 120000,
  region: "regulated",
  borrower: "firstHome",
};

const T1 = "2026-10-21T01:00:00.000Z";
const T2 = "2026-10-21T02:00:00.000Z";
const T3 = "2026-10-21T03:00:00.000Z";

/** id와 시각을 정해진 순서로 돌려주는 스토어. 같은 storage로 다시 만들면 새로고침이다. */
function setup(storage = createMemoryStorage()) {
  const ids = ["id-1", "id-2", "id-3"];
  const times = [T1, T2, T3];
  const createId = vi.fn(() => ids.shift() ?? "id-x");
  const now = vi.fn(() => times.shift() ?? "2026-10-21T09:00:00.000Z");
  const store = createListingStore({ storage, createId, now });
  const listener = vi.fn();
  store.subscribe(listener);
  return { storage, store, listener, createId, now };
}

function listingsOf(store: ReturnType<typeof setup>["store"]) {
  const snapshot = store.getSnapshot();
  if (snapshot.status !== "ok") throw new Error(`스냅샷이 ok가 아님: ${snapshot.status}`);
  return snapshot.listings;
}

function storedRaw(storage: Storage) {
  return storage.getItem(LISTINGS_STORAGE_KEY);
}

describe("add", () => {
  it("주입한 createId·now로 id와 createdAt = updatedAt을 채워 저장하고 통지한다", () => {
    const { storage, store, listener } = setup();

    const result = store.add(INPUT);

    const expected = { id: "id-1", ...INPUT, createdAt: T1, updatedAt: T1 };
    expect(result).toEqual({ ok: true, listing: expected });
    expect(listingsOf(store)).toEqual([expected]);
    expect(JSON.parse(storedRaw(storage) ?? "")).toEqual([expected]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("저장 필드만 저장한다(입력 객체에 섞인 다른 키는 버린다)", () => {
    const { store } = setup();
    const withExtra = { ...INPUT, id: "forged", createdAt: "1999-01-01", extra: 1 };

    store.add(withExtra as ListingInput);

    expect(listingsOf(store)[0]).toEqual({
      id: "id-1",
      ...INPUT,
      createdAt: T1,
      updatedAt: T1,
    });
  });

  it("새로고침(같은 Storage로 만든 새 스토어) 후에도 남고, 삭제하면 다시 로드해도 돌아오지 않는다 (AC-6a)", () => {
    const first = setup();
    first.store.add(INPUT);
    first.store.add({ ...INPUT, name: "자이 3단지" });

    const reloaded = setup(first.storage);
    expect(listingsOf(reloaded.store).map((listing) => listing.name)).toEqual([
      "래미안 101동",
      "자이 3단지",
    ]);

    expect(reloaded.store.remove("id-1")).toEqual({ ok: true });

    const reloadedAgain = setup(first.storage);
    expect(listingsOf(reloadedAgain.store).map((listing) => listing.id)).toEqual(["id-2"]);
  });
});

describe("update (AC-7 덮어쓰기)", () => {
  function seeded() {
    const storage = createMemoryStorage({
      [LISTINGS_STORAGE_KEY]: JSON.stringify([
        makeListing({ id: "a", name: "가", createdAt: "2026-10-01T00:00:00.000Z" }),
        makeListing({
          id: "b",
          name: "나",
          createdAt: "2026-10-02T00:00:00.000Z",
          updatedAt: "2026-10-03T00:00:00.000Z",
        }),
        makeListing({ id: "c", name: "다" }),
      ]),
    });
    return setup(storage);
  }

  it("같은 id의 매물을 갱신하고 createdAt은 유지, updatedAt만 now()로 바꾸며 위치와 개수는 그대로다", () => {
    const { storage, store, listener, createId } = seeded();
    const next: ListingInput = {
      name: "나(수정)",
      salePrice: 130000,
      kbPrice: 118000,
      region: "capitalNonRegulated",
      borrower: "oneHomeDisposal",
    };

    expect(store.update("b", next)).toEqual({ ok: true });

    const listings = listingsOf(store);
    expect(listings.map((listing) => listing.id)).toEqual(["a", "b", "c"]);
    expect(listings[1]).toEqual({
      id: "b",
      ...next,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: T1,
    });
    expect(createId).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
    // 새로고침 후에도 같다.
    expect(listingsOf(setup(storage).store)[1]).toEqual(listings[1]);
  });

  it("없는 id면 notFound이고 저장하지 않으며 통지하지 않는다", () => {
    const { storage, store, listener } = seeded();
    const before = store.getSnapshot();
    const setItem = vi.spyOn(storage, "setItem");

    expect(store.update("missing", INPUT)).toEqual({ ok: false, reason: "notFound" });

    expect(setItem).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
  });
});

describe("사용자 지정 LTV 저장 (AC-3b, ADR-012)", () => {
  /** 계산 화면이 저장할 때와 같은 경로: draft → toLoanInput → { ...loanInput, name } */
  function inputFromDraft(customLtv: string | null): ListingInput {
    const loanInput = toLoanInput({
      salePrice: "100000",
      kbPrice: "100000",
      region: "regulated",
      borrower: "noHome",
      listingId: null,
      customLtv,
      isCustomLtvInput: false,
      isAreaOver85: false,
      extraCosts: [],
    });
    if (loanInput === null) throw new Error("전제: 유효한 입력");
    return { ...loanInput, name: "래미안 101동" };
  }

  function rawItems(storage: Storage): Record<string, unknown>[] {
    return JSON.parse(storedRaw(storage) ?? "null") as Record<string, unknown>[];
  }

  it("customLtvRate 70은 저장 → 새 스토어 로드 왕복 후에도 70이다", () => {
    const first = setup();
    first.store.add(inputFromDraft("70%"));

    expect(rawItems(first.storage)[0].customLtvRate).toBe(70);
    expect(listingsOf(setup(first.storage).store)[0]).toMatchObject({ customLtvRate: 70 });
  });

  it("customLtvRate 0도 키가 남는다(falsy로 버리지 않는다)", () => {
    const { storage, store } = setup();
    store.add(inputFromDraft("0"));
    expect(rawItems(storage)[0]).toHaveProperty("customLtvRate", 0);
  });

  it("규제 LTV로 저장한 매물의 JSON에는 customLtvRate 키가 없다", () => {
    const { storage, store } = setup();
    store.add(inputFromDraft(null));
    store.add({ ...INPUT, customLtvRate: undefined });

    expect(storedRaw(storage)).not.toContain("customLtvRate");
    for (const item of rawItems(storage)) {
      expect(Object.hasOwn(item, "customLtvRate")).toBe(false);
    }
  });

  it("사용자 지정이던 매물을 규제로 되돌려 덮어쓰면 키가 사라진다", () => {
    const seededStorage = createMemoryStorage({
      [LISTINGS_STORAGE_KEY]: JSON.stringify([
        makeListing({ id: "a", customLtvRate: 70 }),
        makeListing({ id: "b", customLtvRate: 50 }),
      ]),
    });
    const { storage, store } = setup(seededStorage);

    expect(store.update("a", inputFromDraft(null))).toEqual({ ok: true });

    const [updated, untouched] = rawItems(storage);
    expect(Object.hasOwn(updated, "customLtvRate")).toBe(false);
    expect(untouched.customLtvRate).toBe(50);
    const reloaded = listingsOf(setup(storage).store);
    expect(Object.hasOwn(reloaded[0], "customLtvRate")).toBe(false);
  });

  it("규제였던 매물을 사용자 지정으로 덮어쓰면 키가 생기고, 값을 바꾸면 새 값이다", () => {
    const { storage, store } = setup(
      createMemoryStorage({ [LISTINGS_STORAGE_KEY]: JSON.stringify([makeListing({ id: "a" })]) }),
    );

    store.update("a", inputFromDraft("70"));
    expect(rawItems(storage)[0].customLtvRate).toBe(70);
    store.update("a", inputFromDraft("55"));
    expect(rawItems(storage)[0].customLtvRate).toBe(55);
  });
});

describe("remove", () => {
  it("해당 id만 지우고 통지한다", () => {
    const { store, listener } = setup(
      createMemoryStorage({
        [LISTINGS_STORAGE_KEY]: JSON.stringify([
          makeListing({ id: "a" }),
          makeListing({ id: "b" }),
        ]),
      }),
    );

    expect(store.remove("a")).toEqual({ ok: true });

    expect(listingsOf(store).map((listing) => listing.id)).toEqual(["b"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("없는 id면 notFound이고 저장하지 않는다", () => {
    const { storage, store, listener } = setup(
      createMemoryStorage({ [LISTINGS_STORAGE_KEY]: JSON.stringify([makeListing({ id: "a" })]) }),
    );
    const setItem = vi.spyOn(storage, "setItem");

    expect(store.remove("missing")).toEqual({ ok: false, reason: "notFound" });

    expect(setItem).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect(listingsOf(store).map((listing) => listing.id)).toEqual(["a"]);
  });
});

describe("손상 상태 (AC-6d)", () => {
  function corrupt(rawText = "{") {
    const storage = createMemoryStorage({ [LISTINGS_STORAGE_KEY]: rawText });
    const setItem = vi.spyOn(storage, "setItem");
    return { ...setup(storage), setItem };
  }

  it("스냅샷은 corrupt이고 원문을 그대로 담는다", () => {
    const { store } = corrupt('[{"id":""}]');
    expect(store.getSnapshot()).toEqual({ status: "corrupt", rawText: '[{"id":""}]' });
  });

  it("add / update / remove는 setItem을 호출하지 않고 corrupt로 실패하며, 원문과 스냅샷이 그대로다", () => {
    const { storage, store, listener, setItem, createId, now } = corrupt();
    const before = store.getSnapshot();

    expect(store.add(INPUT)).toEqual({ ok: false, reason: "corrupt" });
    expect(store.update("id-1", INPUT)).toEqual({ ok: false, reason: "corrupt" });
    expect(store.remove("id-1")).toEqual({ ok: false, reason: "corrupt" });

    expect(setItem).not.toHaveBeenCalled();
    expect(storedRaw(storage)).toBe("{");
    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    expect(createId).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
  });

  it("손상 상태가 빈 목록으로 조용히 바뀌지 않는다: reset 전에는 계속 corrupt다", () => {
    const { storage, store } = corrupt();
    store.add(INPUT);
    expect(store.getSnapshot().status).toBe("corrupt");
    expect(setup(storage).store.getSnapshot().status).toBe("corrupt");
  });

  it("reset은 원문을 지우고 빈 목록 ok로 만들며 통지한다. 그 뒤에는 저장된다", () => {
    const { storage, store, listener } = corrupt();
    const removeItem = vi.spyOn(storage, "removeItem");

    expect(store.reset()).toEqual({ ok: true });

    expect(removeItem).toHaveBeenCalledWith(LISTINGS_STORAGE_KEY);
    expect(storedRaw(storage)).toBeNull();
    expect(store.getSnapshot()).toEqual({ status: "ok", listings: [] });
    expect(listener).toHaveBeenCalledTimes(1);

    expect(store.add(INPUT)).toMatchObject({ ok: true, listing: { id: "id-1" } });
    expect(listingsOf(store)).toHaveLength(1);
  });
});

describe("접근 불가 (AC-6e)", () => {
  it("getItem이 throw하면 스냅샷은 unavailable이고 쓰기는 setItem 없이 unavailable로 실패한다", () => {
    const storage = createMemoryStorage();
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const setItem = vi.spyOn(storage, "setItem");
    const { store, listener } = setup(storage);

    expect(store.getSnapshot()).toEqual({ status: "unavailable" });
    expect(store.add(INPUT)).toEqual({ ok: false, reason: "unavailable" });
    expect(store.update("a", INPUT)).toEqual({ ok: false, reason: "unavailable" });
    expect(store.remove("a")).toEqual({ ok: false, reason: "unavailable" });

    expect(setItem).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it("reset 중 removeItem이 throw하면 unavailable이고 통지하지 않는다", () => {
    const storage = createMemoryStorage({ [LISTINGS_STORAGE_KEY]: "{" });
    vi.spyOn(storage, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const { store, listener } = setup(storage);

    expect(store.reset()).toEqual({ ok: false, reason: "unavailable" });
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot().status).toBe("corrupt");
  });

  describe("setItem이 throw하면(용량 초과) 메모리 목록도 바뀌지 않는다", () => {
    function quotaExceeded() {
      const storage = createMemoryStorage({
        [LISTINGS_STORAGE_KEY]: JSON.stringify([makeListing({ id: "a" })]),
      });
      const harness = setup(storage);
      vi.spyOn(storage, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
      const before = harness.store.getSnapshot();
      return { ...harness, before };
    }

    it("add", () => {
      const { store, listener, before } = quotaExceeded();
      expect(store.add(INPUT)).toEqual({ ok: false, reason: "unavailable" });
      expect(store.getSnapshot()).toBe(before);
      expect(listingsOf(store).map((listing) => listing.id)).toEqual(["a"]);
      expect(listener).not.toHaveBeenCalled();
    });

    it("update", () => {
      const { store, listener, before } = quotaExceeded();
      expect(store.update("a", { ...INPUT, name: "바뀐 이름" })).toEqual({
        ok: false,
        reason: "unavailable",
      });
      expect(store.getSnapshot()).toBe(before);
      expect(listingsOf(store)[0].name).toBe("래미안 101동");
      expect(listener).not.toHaveBeenCalled();
    });

    it("remove", () => {
      const { store, listener, before } = quotaExceeded();
      expect(store.remove("a")).toEqual({ ok: false, reason: "unavailable" });
      expect(store.getSnapshot()).toBe(before);
      expect(listingsOf(store)).toHaveLength(1);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe("스냅샷 참조 (AC-6f)", () => {
  it("변경이 없으면 getSnapshot()은 같은 참조를 반환한다(ok·corrupt·키 없음)", () => {
    const ok = setup(
      createMemoryStorage({ [LISTINGS_STORAGE_KEY]: JSON.stringify([makeListing()]) }),
    );
    const corrupt = setup(createMemoryStorage({ [LISTINGS_STORAGE_KEY]: "{" }));
    const empty = setup();

    for (const { store } of [ok, corrupt, empty]) {
      const first = store.getSnapshot();
      expect(store.getSnapshot()).toBe(first);
      // 통지만 오고 원문이 그대로면 여전히 같은 참조다.
      store.notify();
      expect(store.getSnapshot()).toBe(first);
    }
  });

  it("쓰기 후에는 새 상태를 반환한다", () => {
    const { store } = setup();
    const before = store.getSnapshot();

    store.add(INPUT);

    const after = store.getSnapshot();
    expect(after).not.toBe(before);
    expect(after).toEqual({ status: "ok", listings: [expect.objectContaining({ id: "id-1" })] });
  });

  it("다른 탭이 저장소를 바꾼 뒤 notify(storage 이벤트)하면 구독자가 불리고 새 상태를 반환한다", () => {
    const { storage, store, listener } = setup();
    const before = store.getSnapshot();

    // 다른 탭의 쓰기: 같은 storage를 직접 바꾼다.
    const otherTab = makeListing({ id: "from-other-tab" });
    storage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify([otherTab]));
    store.notify();

    expect(listener).toHaveBeenCalledTimes(1);
    const after = store.getSnapshot();
    expect(after).not.toBe(before);
    expect(after).toEqual({ status: "ok", listings: [otherTab] });
  });

  it("다른 탭이 원문을 손상시키면 notify 후 corrupt가 된다", () => {
    const { storage, store } = setup();
    storage.setItem(LISTINGS_STORAGE_KEY, "[");
    store.notify();
    expect(store.getSnapshot()).toEqual({ status: "corrupt", rawText: "[" });
  });

  it("구독 해제 후에는 통지받지 않는다", () => {
    const store = createListingStore({
      storage: createMemoryStorage(),
      createId: () => "id-1",
      now: () => T1,
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.add(INPUT);

    expect(listener).not.toHaveBeenCalled();
  });
});

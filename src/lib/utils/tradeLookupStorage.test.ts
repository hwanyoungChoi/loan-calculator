import { describe, expect, it } from "vitest";

import { createMemoryStorage } from "@/test/memoryStorage";

import {
  createTradeLookupStore,
  parseTradeLookup,
  TRADE_LOOKUP_STORAGE_KEY,
} from "./tradeLookupStorage";

describe("조회 기억", () => {
  it("고른 시군구를 별도 키에 저장하고 새 스토어(새로고침)에서 다시 읽는다", () => {
    const storage = createMemoryStorage();
    createTradeLookupStore({ storage }).save("11680");

    expect(storage.getItem(TRADE_LOOKUP_STORAGE_KEY)).toBe('{"lawdCd":"11680"}');
    expect(createTradeLookupStore({ storage }).load()).toBe("11680");
  });

  it.each([
    ["키 없음", null],
    ["JSON 아님", "{"],
    ["형태 틀림", '{"lawdCd":11680}'],
    ["목록에 없는 코드", '{"lawdCd":"99999"}'],
  ])("%s이면 기억 없음이다", (_, raw) => {
    expect(parseTradeLookup(raw)).toBeNull();
  });
});

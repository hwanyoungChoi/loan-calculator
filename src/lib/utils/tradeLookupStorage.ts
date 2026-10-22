import { LAWD_CODES } from "@/lib/constants/lawdCodes";

import type { TradeLookupStore } from "@/lib/types/tradeLookup";

export const TRADE_LOOKUP_STORAGE_KEY = "loan-calculator/trade-lookup";

/** 저장소 원문 → 시군구 코드. JSON·형태가 틀렸거나 `LAWD_CODES`에 없는 코드면 기억 없음(null)이다. */
export function parseTradeLookup(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { lawdCd } = value as Record<string, unknown>;
  if (typeof lawdCd !== "string") return null;
  return LAWD_CODES.some((entry) => entry.code === lawdCd) ? lawdCd : null;
}

/** 키 `loan-calculator/trade-lookup`에 `{ "lawdCd": "11680" }`. 접근 불가면 기억 없이 동작한다. */
export function createTradeLookupStore({ storage }: { storage: Storage }): TradeLookupStore {
  return {
    load() {
      try {
        return parseTradeLookup(storage.getItem(TRADE_LOOKUP_STORAGE_KEY));
      } catch {
        return null;
      }
    },
    save(lawdCd) {
      try {
        storage.setItem(TRADE_LOOKUP_STORAGE_KEY, JSON.stringify({ lawdCd }));
      } catch {
        // 기억하지 못해도 조회는 된다.
      }
    },
  };
}

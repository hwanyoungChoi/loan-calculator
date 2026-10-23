import { isListing } from "./validateListingFields";

import type { Listing, LoadListingsResult } from "@/lib/types/listing";
import type { StorageWriteResult } from "@/lib/types/storage";

export const LISTINGS_STORAGE_KEY = "loan-calculator/listings";

/**
 * 저장소 원문 → 목록. 키 없음(null)은 빈 목록이다.
 * 하나라도 어긋나면 항목을 골라 버리지 않고 전체를 corrupt로 본다(조용한 손실 방지, ADR-001).
 */
export function parseListings(rawText: string | null): LoadListingsResult {
  if (rawText === null) return { ok: true, listings: [] };
  let value: unknown;
  try {
    value = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: "corrupt", rawText };
  }
  if (!Array.isArray(value) || !value.every(isListing)) {
    return { ok: false, reason: "corrupt", rawText };
  }
  return { ok: true, listings: value };
}

/** 키 `loan-calculator/listings`. 키 없음은 빈 목록, 하나라도 어긋나면 전체 corrupt */
export function loadListings(storage: Storage): LoadListingsResult {
  let rawText: string | null;
  try {
    rawText = storage.getItem(LISTINGS_STORAGE_KEY);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  return parseListings(rawText);
}

export function saveListings(storage: Storage, listings: Listing[]): StorageWriteResult {
  try {
    storage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

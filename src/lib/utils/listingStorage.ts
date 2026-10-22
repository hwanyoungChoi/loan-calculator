import { BORROWERS, REGIONS } from "@/lib/constants/loanConditions";

import { MAX_AMOUNT } from "./amount";
import { isOneOf } from "./isOneOf";
import { LISTING_MEMO_MAX_LENGTH } from "./validateListingMemo";
import { countChars, LISTING_NAME_MAX_LENGTH } from "./validateListingName";

import type { Listing, LoadListingsResult } from "@/lib/types/listing";
import type { StorageWriteResult } from "@/lib/types/storage";

export const LISTINGS_STORAGE_KEY = "loan-calculator/listings";

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrice(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_AMOUNT;
}

/** 검증 순서는 typeof → 정수 → 0~100이다(ADR-012). null·"70"·70.5는 모두 아니다. */
function isLtvRate(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

/** `Date.parse`는 2월 30일도 받아 주므로 연·월·일이 실제 달력에 있는지 따로 본다. */
function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE_TIME_PATTERN.exec(value);
  if (match === null || Number.isNaN(Date.parse(value))) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isListing(value: unknown): value is Listing {
  if (!isRecord(value)) return false;
  const { id, name, salePrice, kbPrice, region, borrower, createdAt, updatedAt } = value;
  return (
    typeof id === "string" &&
    id !== "" &&
    typeof name === "string" &&
    countChars(name) >= 1 &&
    countChars(name) <= LISTING_NAME_MAX_LENGTH &&
    isPrice(salePrice) &&
    isPrice(kbPrice) &&
    isOneOf(REGIONS, region) &&
    isOneOf(BORROWERS, borrower) &&
    isIsoDateString(createdAt) &&
    isIsoDateString(updatedAt) &&
    // 선택 필드: 키가 없으면 규제 LTV(1차 형식 그대로), 키가 있으면 값이 유효해야 한다.
    (!Object.hasOwn(value, "customLtvRate") || isLtvRate(value.customLtvRate)) &&
    // 85㎡ 초과는 true일 때만 키를 쓴다. 키가 없는 1·2차 형식은 85㎡ 이하다(ADR-022).
    (!Object.hasOwn(value, "isAreaOver85") || value.isAreaOver85 === true) &&
    // 메모는 키 없음 = 메모 없음. 키가 있으면 500자 이하 문자열이어야 한다.
    (!Object.hasOwn(value, "memo") ||
      (typeof value.memo === "string" && countChars(value.memo) <= LISTING_MEMO_MAX_LENGTH))
  );
}

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

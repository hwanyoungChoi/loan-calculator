// 클라이언트 저장소 파서와 서버(server/*, 상대 경로 import)가 함께 쓰는 매물 검증 규칙의 원본.
// worker 프로젝트(tsconfig.worker.json: lib ES2023, paths 없음)에서도 타입 검사를 통과하도록
// 이 파일과 전이 의존은 DOM 타입과 `@/` 별칭을 쓰지 않는다.

import { MAX_AMOUNT } from "./amount";
import { isOneOf } from "./isOneOf";
import { LISTING_MEMO_MAX_LENGTH } from "./validateListingMemo";
import { countChars, LISTING_NAME_MAX_LENGTH } from "./validateListingName";
import {
  EXTRA_COST_CATEGORIES,
  EXTRA_COST_LABEL_MAX_LENGTH,
  EXTRA_COST_MAX_ITEMS,
} from "../constants/extraCosts";
import { LISTING_STATUSES } from "../constants/listingStatus";
import { BORROWERS, REGIONS } from "../constants/loanConditions";

import type { ExtraCost } from "../types/extraCost";
import type { Listing, ListingInput, ListingStatus } from "../types/listing";

const LISTING_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

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

/**
 * 추가 비용 항목 이름: trim 후 1~30자(코드포인트). 성공하면 trim한 이름을 돌려준다.
 * 클라이언트 줄 입력과 저장 값 검증(`validateListingFields`)이 함께 쓰는 규칙의 원본이다.
 */
export function validateExtraCostLabel(
  raw: string,
): { ok: true; label: string } | { ok: false; message: string } {
  const label = raw.trim();
  const length = countChars(label);
  if (length === 0) return { ok: false, message: "항목 이름을 입력하세요" };
  if (length > EXTRA_COST_LABEL_MAX_LENGTH) {
    return {
      ok: false,
      message: `${EXTRA_COST_LABEL_MAX_LENGTH}자 이하로 입력하세요(현재 ${length}자)`,
    };
  }
  return { ok: true, label };
}

/**
 * 저장 값의 추가 비용 줄을 검증하고 알려진 세 키만 담은 새 배열을 돌려준다. 어긋나면 null(null·객체 포함).
 * 이름은 trim하지 않고 원문을 저장하므로(클라이언트가 먼저 걷는다) 원문 길이도 상한 안이어야 한다.
 */
function parseExtraCosts(value: unknown): ExtraCost[] | null {
  if (!Array.isArray(value) || value.length > EXTRA_COST_MAX_ITEMS) return null;
  const extraCosts: ExtraCost[] = [];
  for (const item of value as unknown[]) {
    if (!isRecord(item)) return null;
    const { category, label, amount } = item;
    const isValid =
      isOneOf(EXTRA_COST_CATEGORIES, category) &&
      typeof label === "string" &&
      countChars(label) <= EXTRA_COST_LABEL_MAX_LENGTH &&
      validateExtraCostLabel(label).ok &&
      isPrice(amount);
    if (!isValid) return null;
    extraCosts.push({ category, label, amount });
  }
  return extraCosts;
}

/** 매물 상태 세 값 중 하나인지(ADR-027). null·빈 문자열은 아니다. 저장 값 검증과 서버 PATCH가 함께 쓴다. */
export function isListingStatus(value: unknown): value is ListingStatus {
  return isOneOf(LISTING_STATUSES, value);
}

/**
 * 서버 경계의 매물 id 규칙(ADR-023). 로컬 id(16바이트 hex, ADR-010)를 서버 id로 그대로 쓰므로 hex로 좁히지 않는다.
 * 서버·공유 수신에만 쓴다. 로컬 저장소 읽기(`isListing`)에는 넣지 않는다(기존 데이터를 새로 거부하지 않게, AC-0).
 */
export function isListingId(value: unknown): value is string {
  return typeof value === "string" && LISTING_ID_PATTERN.test(value);
}

/** `Date.parse`는 2월 30일도 받아 주므로 연·월·일이 실제 달력에 있는지 따로 본다. */
export function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE_TIME_PATTERN.exec(value);
  if (match === null || Number.isNaN(Date.parse(value))) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * 매물 필드(id·시각 제외)를 검증하고, 알려진 키만 골라 새 객체로 돌려준다. 어긋나면 null.
 * 선택 필드는 키 없음 = 기본이다(ADR-012). 키가 있으면 값이 유효해야 한다.
 * 판정 규칙은 로컬 저장소 파서가 쓰던 그대로다(AC-0). 빈 메모·빈 추가 비용은 받되 돌려주는 객체에는 키를 쓰지 않는다
 * (스토어의 `toListingFields`와 같은 규칙, 서버·공유에는 빈 메모·빈 배열이 저장되지 않는다).
 */
export function validateListingFields(value: unknown): ListingInput | null {
  if (!isRecord(value)) return null;
  const { name, salePrice, kbPrice, region, borrower } = value;
  // 추가 비용은 키 없음 = 없음(1·2·3차 형식 전부). 키가 있으면 0~30줄 배열이어야 한다(null은 거부).
  const extraCosts = Object.hasOwn(value, "extraCosts") ? parseExtraCosts(value.extraCosts) : [];
  const isValid =
    typeof name === "string" &&
    countChars(name) >= 1 &&
    countChars(name) <= LISTING_NAME_MAX_LENGTH &&
    isPrice(salePrice) &&
    isPrice(kbPrice) &&
    isOneOf(REGIONS, region) &&
    isOneOf(BORROWERS, borrower) &&
    // 키가 없으면 규제 LTV(1차 형식 그대로)
    (!Object.hasOwn(value, "customLtvRate") || isLtvRate(value.customLtvRate)) &&
    // 85㎡ 초과는 true일 때만 키를 쓴다. 키가 없는 1·2차 형식은 85㎡ 이하다(ADR-022).
    (!Object.hasOwn(value, "isAreaOver85") || value.isAreaOver85 === true) &&
    // 메모는 키 없음 = 메모 없음. 키가 있으면 LISTING_MEMO_MAX_LENGTH(5,000자) 이하 문자열이어야 한다.
    (!Object.hasOwn(value, "memo") ||
      (typeof value.memo === "string" && countChars(value.memo) <= LISTING_MEMO_MAX_LENGTH)) &&
    // 상태는 키 없음 = 미지정(ADR-027). 키가 있으면 세 값 중 하나여야 한다(null·빈 문자열 거부).
    (!Object.hasOwn(value, "status") || isListingStatus(value.status)) &&
    extraCosts !== null;
  if (!isValid) return null;
  return {
    name,
    salePrice,
    kbPrice,
    region,
    borrower,
    ...(Object.hasOwn(value, "customLtvRate") && { customLtvRate: value.customLtvRate as number }),
    ...(Object.hasOwn(value, "isAreaOver85") && { isAreaOver85: true as const }),
    ...(typeof value.memo === "string" && value.memo !== "" && { memo: value.memo }),
    // 빈 배열은 받되 키를 쓰지 않는다(빈 메모와 같은 규칙).
    ...(extraCosts.length > 0 && { extraCosts }),
    ...(Object.hasOwn(value, "status") && { status: value.status as ListingStatus }),
  };
}

/**
 * 로컬 저장 매물 하나: id·시각 + 필드. id는 비어 있지 않은 문자열까지만 본다(ADR-010, 기존 판정 그대로).
 * 서버 경계에서는 여기에 `isListingId`를 더한다.
 */
export function isListing(value: unknown): value is Listing {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    isIsoDateString(value.createdAt) &&
    isIsoDateString(value.updatedAt) &&
    validateListingFields(value) !== null
  );
}

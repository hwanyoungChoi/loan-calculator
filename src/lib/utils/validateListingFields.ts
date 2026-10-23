// 클라이언트 저장소 파서와 서버(server/*, 상대 경로 import)가 함께 쓰는 매물 검증 규칙의 원본.
// worker 프로젝트(tsconfig.worker.json: lib ES2023, paths 없음)에서도 타입 검사를 통과하도록
// 이 파일과 전이 의존은 DOM 타입과 `@/` 별칭을 쓰지 않는다.

import { MAX_AMOUNT } from "./amount";
import { isOneOf } from "./isOneOf";
import { LISTING_MEMO_MAX_LENGTH } from "./validateListingMemo";
import { countChars, LISTING_NAME_MAX_LENGTH } from "./validateListingName";
import { BORROWERS, REGIONS } from "../constants/loanConditions";

import type { Listing, ListingInput } from "../types/listing";

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
 * 판정 규칙은 로컬 저장소 파서가 쓰던 그대로다(AC-0). 빈 메모는 받되 돌려주는 객체에는 키를 쓰지 않는다
 * (스토어의 `toListingFields`와 같은 규칙, 서버·공유에는 빈 메모가 저장되지 않는다).
 */
export function validateListingFields(value: unknown): ListingInput | null {
  if (!isRecord(value)) return null;
  const { name, salePrice, kbPrice, region, borrower } = value;
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
    // 메모는 키 없음 = 메모 없음. 키가 있으면 500자 이하 문자열이어야 한다.
    (!Object.hasOwn(value, "memo") ||
      (typeof value.memo === "string" && countChars(value.memo) <= LISTING_MEMO_MAX_LENGTH));
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

// /api/listings 본문 검증. 매물 규칙은 클라이언트 저장소와 같은 공유 검증 함수를 쓰고,
// 서버 경계에서는 id·시각 규칙(ADR-023)을 더한다. 검증 뒤에는 알려진 키만 남긴다.
import {
  isIsoDateString,
  isListingId,
  isListingStatus,
  validateListingFields,
} from "../../src/lib/utils/validateListingFields";
import { validateListingMemo } from "../../src/lib/utils/validateListingMemo";

import type { ListingInput, ListingStatus } from "../../src/lib/types/listing";

export const IMPORT_MAX_LISTINGS = 100;

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

/** import 한 항목. `data`는 `listings.data` 컬럼에 들어갈 필드(빈 메모는 키 없음) */
export type ImportedListing = {
  id: string;
  data: ListingInput;
  createdAt: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** POST·PUT 본문 `{ listing: ListingInput }` */
export function parseListingRequest(value: unknown): Parsed<ListingInput> {
  const fields = isRecord(value) ? validateListingFields(value.listing) : null;
  return fields === null
    ? { ok: false, message: "요청 본문은 { listing } 객체이고 매물 값이 올바라야 합니다" }
    : { ok: true, value: fields };
}

/**
 * PATCH로 `listings.data`에 합칠 JSON Merge Patch(RFC 7396). 키 없음 = 그대로, null = 키 지움.
 * 빈 메모는 null로 바꿔 둔다(저장 값에 빈 메모를 두지 않는다).
 */
export type ListingPatch = { memo?: string | null; status?: ListingStatus | null };

/**
 * PATCH 본문 `{ memo?: string, status?: ListingStatus | null }`. 둘 중 하나 이상 있어야 한다.
 * 메모는 앞뒤 공백을 빼고 0~5,000자(`validateListingMemo`), 빈 문자열은 메모 지움.
 * 상태는 세 값 중 하나(`isListingStatus`), null은 상태 지움(ADR-027).
 */
export function parseListingPatchRequest(value: unknown): Parsed<ListingPatch> {
  const hasMemo = isRecord(value) && Object.hasOwn(value, "memo");
  const hasStatus = isRecord(value) && Object.hasOwn(value, "status");
  if (!isRecord(value) || (!hasMemo && !hasStatus)) {
    return {
      ok: false,
      message: "요청 본문은 { memo } 또는 { status } 중 하나 이상을 담은 객체여야 합니다",
    };
  }

  const patch: ListingPatch = {};
  if (hasMemo) {
    if (typeof value.memo !== "string") {
      return { ok: false, message: "memo는 문자열이어야 합니다" };
    }
    const memo = validateListingMemo(value.memo);
    if (!memo.ok) return { ok: false, message: memo.message };
    patch.memo = memo.memo === "" ? null : memo.memo;
  }
  if (hasStatus) {
    if (value.status !== null && !isListingStatus(value.status)) {
      return { ok: false, message: "status는 candidate, hold, rejected 또는 null이어야 합니다" };
    }
    patch.status = value.status;
  }
  return { ok: true, value: patch };
}

/** import 본문 `{ listings: Listing[] }` 1~100개. id·createdAt·updatedAt 포함 */
export function parseImportRequest(value: unknown): Parsed<ImportedListing[]> {
  const listings = isRecord(value) ? value.listings : undefined;
  if (!Array.isArray(listings) || listings.length === 0) {
    return { ok: false, message: "listings는 매물 1개 이상의 배열이어야 합니다" };
  }
  if (listings.length > IMPORT_MAX_LISTINGS) {
    return { ok: false, message: `한 번에 ${IMPORT_MAX_LISTINGS}개까지 옮길 수 있습니다` };
  }

  const parsed: ImportedListing[] = [];
  for (const [index, listing] of (listings as unknown[]).entries()) {
    const data = validateListingFields(listing);
    if (
      data === null ||
      !isRecord(listing) ||
      !isListingId(listing.id) ||
      !isIsoDateString(listing.createdAt) ||
      !isIsoDateString(listing.updatedAt)
    ) {
      return { ok: false, message: `${index + 1}번째 매물의 값이 올바르지 않습니다` };
    }
    parsed.push({
      id: listing.id,
      data,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    });
  }
  return { ok: true, value: parsed };
}

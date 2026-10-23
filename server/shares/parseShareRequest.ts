import { isOneOf } from "../../src/lib/utils/isOneOf";
import { validateListingFields } from "../../src/lib/utils/validateListingFields";

import type { ShareKind, ShareListing } from "../../src/lib/types/share";

export const SHARE_MAX_LISTINGS = 100;

const SHARE_KINDS: readonly ShareKind[] = ["listing", "list"];

export type ParsedShareRequest =
  { ok: true; kind: ShareKind; listings: ShareListing[] } | { ok: false; message: string };

/** POST /api/shares 본문 검증. 매물은 알려진 키만 남긴다(알 수 없는 키는 저장하지 않음). */
export function parseShareRequest(value: unknown): ParsedShareRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, message: "요청 본문은 { kind, listings } 객체여야 합니다" };
  }
  const { kind, listings } = value as Record<string, unknown>;
  if (!isOneOf(SHARE_KINDS, kind)) {
    return { ok: false, message: "kind는 listing 또는 list여야 합니다" };
  }
  if (!Array.isArray(listings) || listings.length === 0) {
    return { ok: false, message: "listings는 매물 1개 이상의 배열이어야 합니다" };
  }
  if (kind === "listing" && listings.length !== 1) {
    return { ok: false, message: "kind가 listing이면 매물은 1개여야 합니다" };
  }
  if (listings.length > SHARE_MAX_LISTINGS) {
    return { ok: false, message: `한 번에 ${SHARE_MAX_LISTINGS}개까지 공유할 수 있습니다` };
  }

  const validated: ShareListing[] = [];
  for (const [index, listing] of listings.entries()) {
    const fields = validateListingFields(listing);
    if (fields === null) {
      return { ok: false, message: `${index + 1}번째 매물의 값이 올바르지 않습니다` };
    }
    validated.push(fields);
  }
  return { ok: true, kind, listings: validated };
}

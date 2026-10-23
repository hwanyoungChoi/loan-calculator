import { SHARE_KINDS, SHARE_MAX_LISTINGS } from "@/lib/constants/share";
import { isOneOf } from "@/lib/utils/isOneOf";
import { validateListingFields } from "@/lib/utils/validateListingFields";

import type { ShareKind, ShareListing } from "@/lib/types/share";

export type SharedListings = { kind: ShareKind; listings: ShareListing[] };

/**
 * GET 응답을 저장 규칙으로 다시 검증한다. 항목 하나라도 어긋나면 null(아무것도 보이거나 추가하지 않는다).
 * 어긋난 항목이 로컬에 들어가면 받는 사람의 목록 전체가 손상 상태가 되기 때문이다(ADR-001).
 * 돌려주는 매물은 알려진 키만 담는다.
 */
export function parseShareResponse(value: unknown): SharedListings | null {
  if (typeof value !== "object" || value === null) return null;
  const { kind, listings } = value as Record<string, unknown>;
  if (!isOneOf(SHARE_KINDS, kind) || !Array.isArray(listings)) return null;
  if (listings.length === 0 || listings.length > SHARE_MAX_LISTINGS) return null;
  if (kind === "listing" && listings.length !== 1) return null;

  const validated: ShareListing[] = [];
  for (const listing of listings) {
    const fields = validateListingFields(listing);
    if (fields === null) return null;
    validated.push(fields);
  }
  return { kind, listings: validated };
}

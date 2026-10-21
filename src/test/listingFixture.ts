import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import type { Listing } from "@/lib/types/listing";
import type { Borrower, Region, Regulations } from "@/lib/types/regulation";

/** 유효한 저장 매물 하나. 필요한 필드만 덮어쓴다. id·시각은 고정값이다. */
export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    name: "래미안 101동",
    salePrice: 125000,
    kbPrice: 120000,
    region: "regulated",
    borrower: "noHome",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

/** 운영 규제를 복제해 한 셀만 미확인(rate: null)으로 바꾼 fixture. 원본은 건드리지 않는다. */
export function withUnconfirmedCell(region: Region, borrower: Borrower): Regulations {
  const regulations: Regulations = structuredClone(LOAN_REGULATIONS);
  regulations.ltvTable[region][borrower] = { rate: null, effectiveDate: null, sourceUrl: null };
  return regulations;
}

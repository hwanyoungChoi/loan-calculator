/** 구입 대상 주택 소재지 */
export type Region = "regulated" | "capitalNonRegulated" | "nonCapital";

/** 보유 상태. 생애최초는 무주택의 한 경우라 `firstHome` 한 값으로 둔다(ADR-009). */
export type Borrower = "noHome" | "firstHome" | "oneHomeDisposal" | "oneHomeKeep";

/**
 * LTV 셀. `rate`는 0~100 정수 퍼센트(ADR-002).
 * `rate: null`은 미확인이고, `rate: 0`은 확인된 0%다.
 */
export type LtvCell = {
  rate: number | null;
  effectiveDate: string | null;
  sourceUrl: string | null;
  note?: string;
};

/** 한도 상한 구간(만원). `upTo: null`은 마지막 구간이다. */
export type CapTier = { upTo: number | null; cap: number };

export type LoanCap = {
  regions: Region[];
  tiers: CapTier[];
  effectiveDate: string;
  sourceUrl: string;
};

export type RegulationSource = {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  effectiveDate: string | null;
};

export type Regulations = {
  /** YYYY-MM-DD */
  baseDate: string;
  ltvTable: Record<Region, Record<Borrower, LtvCell>>;
  loanCap: LoanCap;
  sources: RegulationSource[];
};

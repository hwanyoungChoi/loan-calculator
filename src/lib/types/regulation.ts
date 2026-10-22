/** 구입 대상 주택 소재지 */
export type Region = "regulated" | "capitalNonRegulated" | "nonCapital";

/**
 * 보유 상태. 생애최초와 서민·실수요자는 무주택의 한 경우라 각각 한 값으로 둔다(ADR-009, ADR-013).
 * 화면 순서는 `BORROWERS`가 정한다.
 */
export type Borrower =
  "noHome" | "firstHome" | "noHomePreferred" | "oneHomeDisposal" | "oneHomeKeep";

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

/** 서민·실수요자 우대 요건. 앱이 판정하는 것은 주택가격뿐이고 나머지는 안내 문구에만 쓴다. */
export type PreferredBorrowerRequirements = {
  /** 만원. 이 값 이하여야 한다 */
  maxHousePrice: number;
  /** 만원. 부부합산 연소득 상한(판정하지 않음) */
  maxCoupleIncome: number;
  /** 판정하지 않음 */
  householdRequirement: string;
  effectiveDate: string;
  sourceUrl: string;
};

/** 세법·중개보수 규정 출처. 조문마다 시행일이 다르고, 확인하지 못한 시행일은 null이다. */
export type CostSource = {
  title: string;
  url: string;
  effectiveDate: string | null;
  note?: string;
};

/**
 * 주택 유상거래 취득세(만원, bp = 0.01%). 6억 초과 9억 이하는 법정 산식이라 계산 함수에 있다.
 * `null`은 1차 출처로 확인하지 못한 값이다.
 */
export type AcquisitionTaxRules = {
  flatUpTo: number;
  flatRateBp: number;
  slopeUpTo: number;
  topRateBp: number;
  /** 조정대상지역 1세대 2주택 중과 */
  regulatedSecondHomeRateBp: number;
  localEducation: { standardShareOfTaxPercent: number; heavyRateBp: number };
  /** 전용 85㎡ 초과만 과세 */
  ruralSpecial: { standardRateBp: number; heavyRateBp: number | null };
  /** 생애최초 감면 한도(만원). 계산에는 넣지 않고 안내만 한다 */
  firstHomeReliefMax: number;
  sources: CostSource[];
};

/** 거래금액 `below` 미만 구간(마지막은 null). `maxFee`는 만원 한도액이고 없으면 null */
export type BrokerageFeeTier = { below: number | null; rateBp: number; maxFee: number | null };

export type BrokerageFeeRules = {
  tiers: BrokerageFeeTier[];
  vatPercent: number;
  sources: CostSource[];
};

export type PurchaseCostRules = {
  /** 세율·요율을 1차 출처와 대조한 날(YYYY-MM-DD) */
  baseDate: string;
  acquisitionTax: AcquisitionTaxRules;
  brokerageFee: BrokerageFeeRules;
};

export type Regulations = {
  /** YYYY-MM-DD */
  baseDate: string;
  ltvTable: Record<Region, Record<Borrower, LtvCell>>;
  loanCap: LoanCap;
  preferredBorrower: PreferredBorrowerRequirements;
  sources: RegulationSource[];
  purchaseCosts: PurchaseCostRules;
};

import type { Borrower, Region } from "./regulation";

/**
 * 금액은 모두 만원 단위 양의 정수다(ADR-002). 검증은 화면에서 한다.
 * `customLtvRate`는 0~100 정수이고, 키가 없으면 규제 LTV로 계산한다. null은 쓰지 않는다(ADR-012).
 * `isAreaOver85`는 전용 85㎡ 초과일 때만 키를 쓴다. 키 없음 = 85㎡ 이하(ADR-022).
 * `Listing`은 구조적으로 이 타입을 포함하므로 저장 매물을 그대로 넘겨도 된다.
 */
export type LoanInput = {
  salePrice: number;
  kbPrice: number;
  region: Region;
  borrower: Borrower;
  customLtvRate?: number;
  isAreaOver85?: true;
};

/** 두 가격 중 어느 쪽이 쓰였는지. 두 가격이 같으면 `equal`. */
export type PriceSource = "salePrice" | "kbPrice" | "equal";

export type CapResult = {
  amount: number;
  tierIndex: number;
  /** 표시용 문구. 테스트는 amount·tierIndex로 단언한다. */
  tierLabel: string;
  capReferencePrice: number;
  capReferenceSource: PriceSource;
  isBoundaryCase: boolean;
};

/** 사용자 지정 LTV가 없었다면 이 조건이 규제로 어떻게 계산됐을지(ADR-013) */
export type RegulationOutcome =
  { status: "ok"; rate: number } | { status: "ineligible" } | { status: "unconfirmed" };

export type AppliedLtv =
  | { source: "regulation"; rate: number }
  | { source: "custom"; rate: number; regulation: RegulationOutcome };

/** 금액은 만원. 항목마다 원 단위로 계산해 만원으로 올림했고, 합계는 올림한 항목의 합이다(ADR-022 D3). */
export type AcquisitionTaxResult = {
  rateBp: number;
  /** 조정대상지역 2주택 중과 */
  isHeavy: boolean;
  tax: number;
  localEducationTax: number;
  /** 85㎡ 이하는 0(비과세). null은 세율이 미확인이라 계산하지 않았다는 뜻이고 합계에서 빠진다 */
  ruralSpecialTax: number | null;
  total: number;
};

export type BrokerageFeeResult = {
  rateBp: number;
  /** 한도액이 적용됐는지 */
  isCapped: boolean;
  /** 만원 올림. 부가세 별도 */
  total: number;
};

export type PurchaseCosts = {
  acquisitionTax: AcquisitionTaxResult;
  brokerageFee: BrokerageFeeResult;
  total: number;
};

type LoanResultBase = {
  collateralBase: number;
  collateralSource: PriceSource;
  /** 한도 상한이 적용되지 않는 지역(비수도권)에서만 null */
  cap: CapResult | null;
  /** 한도와 무관해 계산하지 않는 상태에서도 계산한다 */
  purchaseCosts: PurchaseCosts;
};

export type LoanResult =
  | (LoanResultBase & {
      status: "ok";
      appliedLtv: AppliedLtv;
      ltvAmount: number;
      loanLimit: number;
      /** 매매가 − 예상 한도 */
      downPayment: number;
      /** downPayment + 부대비용 합계 */
      ownFunds: number;
    })
  | (LoanResultBase & {
      status: "unconfirmed";
      appliedLtv: null;
      ltvAmount: null;
      loanLimit: null;
      downPayment: null;
      ownFunds: null;
    })
  | (LoanResultBase & {
      status: "ineligible";
      reason: "housePriceOverLimit";
      /** 요건 판정에 쓴 가격. max(매매가, KB시세) */
      eligibilityPrice: number;
      eligibilityPriceSource: PriceSource;
      appliedLtv: null;
      ltvAmount: null;
      loanLimit: null;
      downPayment: null;
      ownFunds: null;
    });

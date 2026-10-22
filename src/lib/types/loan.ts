import type { Borrower, Region } from "./regulation";

/**
 * 금액은 모두 만원 단위 양의 정수다(ADR-002). 검증은 화면에서 한다.
 * `customLtvRate`는 0~100 정수이고, 키가 없으면 규제 LTV로 계산한다. null은 쓰지 않는다(ADR-012).
 * `Listing`은 구조적으로 이 타입을 포함하므로 저장 매물을 그대로 넘겨도 된다.
 */
export type LoanInput = {
  salePrice: number;
  kbPrice: number;
  region: Region;
  borrower: Borrower;
  customLtvRate?: number;
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

type LoanResultBase = {
  collateralBase: number;
  collateralSource: PriceSource;
  /** 한도 상한이 적용되지 않는 지역(비수도권)에서만 null */
  cap: CapResult | null;
};

export type LoanResult =
  | (LoanResultBase & {
      status: "ok";
      appliedLtv: AppliedLtv;
      ltvAmount: number;
      loanLimit: number;
      ownFunds: number;
    })
  | (LoanResultBase & {
      status: "unconfirmed";
      appliedLtv: null;
      ltvAmount: null;
      loanLimit: null;
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
      ownFunds: null;
    });

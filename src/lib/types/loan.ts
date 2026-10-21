import type { Borrower, LtvCell, Region } from "./regulation";

/** 금액은 모두 만원 단위 양의 정수다(ADR-002). 검증은 화면에서 한다. */
export type LoanInput = { salePrice: number; kbPrice: number; region: Region; borrower: Borrower };

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

type LoanResultBase = {
  collateralBase: number;
  collateralSource: PriceSource;
  ltv: LtvCell;
  /** 한도 상한이 적용되지 않는 지역(비수도권)에서만 null */
  cap: CapResult | null;
};

export type LoanResult =
  | (LoanResultBase & { status: "ok"; ltvAmount: number; loanLimit: number; ownFunds: number })
  | (LoanResultBase & {
      status: "unconfirmed";
      ltvAmount: null;
      loanLimit: null;
      ownFunds: null;
    });

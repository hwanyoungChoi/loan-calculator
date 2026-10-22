import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import { formatManwon } from "./amount";

import type {
  AppliedLtv,
  CapResult,
  LoanInput,
  LoanResult,
  PriceSource,
  RegulationOutcome,
} from "@/lib/types/loan";
import type { CapTier, LoanCap, Regulations } from "@/lib/types/regulation";

/** 가격 하나가 속한 상한 구간. 0 이하는 범위 밖(null)이다. */
export function findCapTier(
  price: number,
  tiers: CapTier[],
): { index: number; cap: number } | null {
  if (price <= 0) return null;
  const index = tiers.findIndex((tier) => tier.upTo === null || price <= tier.upTo);
  if (index === -1) return null;
  return { index, cap: tiers[index].cap };
}

/**
 * 한도 상한 구간을 판단하는 가격. 1차 출처에 "시가" 정의가 없어 큰 쪽으로 보수적으로 판단한다(ADR-005).
 * 서민·실수요자 "주택가격" 요건도 같은 이유로 이 가격으로 판정한다(스펙 가정 A3).
 * 정의가 확인되면 이 함수만 바꾼다.
 */
export function selectCapReferencePrice(salePrice: number, kbPrice: number): number {
  return Math.max(salePrice, kbPrice);
}

/** 고른 가격이 매매가와 KB시세 중 어느 쪽인지 */
function findPriceSource(price: number, salePrice: number, kbPrice: number): PriceSource {
  if (salePrice === kbPrice) return "equal";
  return price === salePrice ? "salePrice" : "kbPrice";
}

/** 담보 기준: 매매가와 KB시세 중 낮은 금액과 그 출처. 입력부의 기준 금액 줄도 이 함수를 쓴다. */
export function selectCollateralBase(
  salePrice: number,
  kbPrice: number,
): { collateralBase: number; collateralSource: PriceSource } {
  const collateralBase = Math.min(salePrice, kbPrice);
  return { collateralBase, collateralSource: findPriceSource(collateralBase, salePrice, kbPrice) };
}

function describeTier(tiers: CapTier[], index: number): string {
  const lower = index > 0 ? tiers[index - 1].upTo : null;
  const upper = tiers[index].upTo;
  if (upper === null) return lower === null ? "전 구간" : `${formatManwon(lower)} 초과 구간`;
  if (lower === null) return `${formatManwon(upper)} 이하 구간`;
  return `${formatManwon(lower)} 초과 ${formatManwon(upper)} 이하 구간`;
}

function requireTier(price: number, tiers: CapTier[]) {
  const tier = findCapTier(price, tiers);
  if (tier === null) {
    throw new RangeError(`금액은 만원 단위 양의 정수여야 합니다: ${price}`);
  }
  return tier;
}

function calculateCap(input: LoanInput, loanCap: LoanCap): CapResult | null {
  if (!loanCap.regions.includes(input.region)) return null;

  const { salePrice, kbPrice } = input;
  const capReferencePrice = selectCapReferencePrice(salePrice, kbPrice);
  const tier = requireTier(capReferencePrice, loanCap.tiers);

  return {
    amount: tier.cap,
    tierIndex: tier.index,
    tierLabel: describeTier(loanCap.tiers, tier.index),
    capReferencePrice,
    capReferenceSource: findPriceSource(capReferencePrice, salePrice, kbPrice),
    isBoundaryCase:
      requireTier(salePrice, loanCap.tiers).index !== requireTier(kbPrice, loanCap.tiers).index,
  };
}

/**
 * 사용자 지정 LTV가 없을 때의 규제 결과. 순서가 결과를 정한다(ADR-013).
 * ① 서민·실수요자인데 판정 가격 max(매매가, KB시세)가 요건 상한 초과면 ineligible(지역 무관)
 * ② 규제 셀이 미확인(rate: null)이면 unconfirmed ③ 나머지는 규제 LTV
 */
export function evaluateRegulation(input: LoanInput, regulations: Regulations): RegulationOutcome {
  const { salePrice, kbPrice, region, borrower } = input;
  if (
    borrower === "noHomePreferred" &&
    selectCapReferencePrice(salePrice, kbPrice) > regulations.preferredBorrower.maxHousePrice
  ) {
    return { status: "ineligible" };
  }
  const { rate } = regulations.ltvTable[region][borrower];
  if (rate === null) return { status: "unconfirmed" };
  return { status: "ok", rate };
}

/**
 * 주담대 예상 한도와 필요한 자기자금.
 * 전제: `salePrice`·`kbPrice`는 만원 단위 양의 정수다(검증은 화면에서 한다).
 * 우선순위: 사용자 지정 LTV → 서민·실수요자 요건 미충족(ineligible) → 미확인(unconfirmed) → 규제 LTV.
 * 계산하지 않는 상태에서도 담보 기준과 한도 상한은 계산하고 나머지는 null이다.
 * 사용자 지정 LTV도 규제 LTV만 대체하고 한도 상한은 그대로 적용한다.
 */
export function calculateLoan(
  input: LoanInput,
  regulations: Regulations = LOAN_REGULATIONS,
): LoanResult {
  const { salePrice, kbPrice, customLtvRate } = input;
  const collateral = selectCollateralBase(salePrice, kbPrice);
  const { collateralBase } = collateral;
  const base = {
    ...collateral,
    cap: calculateCap(input, regulations.loanCap),
  };

  /** 소수 비율(0.7)과 곱하면 부동소수점 오차로 1만원이 내려간다. 정수 퍼센트로 곱한 뒤 나눈다(ADR-002). */
  const calculateOk = (appliedLtv: AppliedLtv): LoanResult => {
    const ltvAmount = Math.floor((collateralBase * appliedLtv.rate) / 100);
    const loanLimit = Math.min(ltvAmount, base.cap?.amount ?? ltvAmount);
    return {
      ...base,
      status: "ok",
      appliedLtv,
      ltvAmount,
      loanLimit,
      ownFunds: salePrice - loanLimit,
    };
  };

  const regulation = evaluateRegulation(input, regulations);

  // 키가 없는 1차 저장 매물은 undefined다. `!== null`로 판정하면 전부 사용자 지정이 된다(ADR-012).
  if (typeof customLtvRate === "number") {
    return calculateOk({ source: "custom", rate: customLtvRate, regulation });
  }
  if (regulation.status === "ok") {
    return calculateOk({ source: "regulation", rate: regulation.rate });
  }
  const notCalculated = { appliedLtv: null, ltvAmount: null, loanLimit: null, ownFunds: null };
  if (regulation.status === "unconfirmed") {
    return { ...base, ...notCalculated, status: "unconfirmed" };
  }
  const eligibilityPrice = selectCapReferencePrice(salePrice, kbPrice);
  return {
    ...base,
    ...notCalculated,
    status: "ineligible",
    reason: "housePriceOverLimit",
    eligibilityPrice,
    eligibilityPriceSource: findPriceSource(eligibilityPrice, salePrice, kbPrice),
  };
}

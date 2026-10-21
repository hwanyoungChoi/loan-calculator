import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import { formatManwon } from "./amount";

import type { CapResult, LoanInput, LoanResult, PriceSource } from "@/lib/types/loan";
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
 * 주담대 예상 한도와 필요한 자기자금.
 * 전제: `salePrice`·`kbPrice`는 만원 단위 양의 정수다(검증은 화면에서 한다).
 * LTV가 미확인(`rate: null`)이면 담보 기준과 한도 상한만 계산하고 나머지는 null이다.
 */
export function calculateLoan(
  input: LoanInput,
  regulations: Regulations = LOAN_REGULATIONS,
): LoanResult {
  const { salePrice, kbPrice, region, borrower } = input;
  const collateralBase = Math.min(salePrice, kbPrice);
  const ltv = regulations.ltvTable[region][borrower];
  const base = {
    collateralBase,
    collateralSource: findPriceSource(collateralBase, salePrice, kbPrice),
    ltv,
    cap: calculateCap(input, regulations.loanCap),
  };

  if (ltv.rate === null) {
    return { ...base, status: "unconfirmed", ltvAmount: null, loanLimit: null, ownFunds: null };
  }

  // 소수 비율(0.7)과 곱하면 부동소수점 오차로 1만원이 내려간다. 정수 퍼센트로 곱한 뒤 나눈다(ADR-002).
  const ltvAmount = Math.floor((collateralBase * ltv.rate) / 100);
  const loanLimit = Math.min(ltvAmount, base.cap?.amount ?? ltvAmount);
  return { ...base, status: "ok", ltvAmount, loanLimit, ownFunds: salePrice - loanLimit };
}

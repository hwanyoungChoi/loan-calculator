import type {
  AcquisitionTaxResult,
  BrokerageFeeResult,
  LoanInput,
  PurchaseCosts,
} from "@/lib/types/loan";
import type { AcquisitionTaxRules, BrokerageFeeRules, Regulations } from "@/lib/types/regulation";

/** 원 → 만원 올림. 자기자금을 작게 보이지 않게 올린다(ADR-022 D3). 정수 나눗셈이라 부동소수점 오차가 결과를 바꾸지 않는다. */
function ceilToManwon(won: number, divisor = 1): number {
  return Math.ceil(won / (divisor * 10000));
}

/**
 * 조정대상지역 2주택 중과는 "1주택 미처분(추가구입)"으로 규제지역(= 조정대상지역)에서 살 때뿐이다.
 * "1주택 처분조건부"는 일시적 2주택이라 일반세율이다(스펙 가정 A1, A2).
 */
function isHeavyTaxed({ borrower, region }: LoanInput): boolean {
  return borrower === "oneHomeKeep" && region === "regulated";
}

/** 6억 초과 9억 이하: (가액 × 2/3억 − 3)%를 bp로 바꾼 식. 소수 넷째 자리(= bp)까지 반올림한다. */
function findGeneralRateBp(salePrice: number, rules: AcquisitionTaxRules): number {
  if (salePrice <= rules.flatUpTo) return rules.flatRateBp;
  if (salePrice <= rules.slopeUpTo) return Math.round((salePrice - 45000) / 150);
  return rules.topRateBp;
}

function calculateAcquisitionTax(
  input: LoanInput,
  rules: AcquisitionTaxRules,
): AcquisitionTaxResult {
  const { salePrice } = input;
  const isHeavy = isHeavyTaxed(input);
  const rateBp = isHeavy ? rules.regulatedSecondHomeRateBp : findGeneralRateBp(salePrice, rules);
  // 만원 × bp = 원
  const taxWon = salePrice * rateBp;
  const localEducationTax = isHeavy
    ? ceilToManwon(salePrice * rules.localEducation.heavyRateBp)
    : ceilToManwon(taxWon * rules.localEducation.standardShareOfTaxPercent, 100);
  const ruralRateBp = isHeavy ? rules.ruralSpecial.heavyRateBp : rules.ruralSpecial.standardRateBp;
  const ruralSpecialTax =
    input.isAreaOver85 !== true
      ? 0
      : ruralRateBp === null
        ? null
        : ceilToManwon(salePrice * ruralRateBp);
  const tax = ceilToManwon(taxWon);
  return {
    rateBp,
    isHeavy,
    tax,
    localEducationTax,
    ruralSpecialTax,
    total: tax + localEducationTax + (ruralSpecialTax ?? 0),
  };
}

/** 거래금액은 매매가다. 구간은 "이상/미만"이라 9억은 0.5% 구간이다. */
function calculateBrokerageFee(salePrice: number, rules: BrokerageFeeRules): BrokerageFeeResult {
  const tier = rules.tiers.find(({ below }) => below === null || salePrice < below);
  if (tier === undefined) throw new RangeError("중개보수 마지막 구간은 below: null이어야 합니다");
  const rateWon = salePrice * tier.rateBp;
  const maxWon = tier.maxFee === null ? rateWon : tier.maxFee * 10000;
  const feeWon = Math.min(rateWon, maxWon);
  const fee = ceilToManwon(feeWon);
  const vat = ceilToManwon(feeWon * rules.vatPercent, 100);
  return { rateBp: tier.rateBp, isCapped: rateWon > maxWon, fee, vat, total: fee + vat };
}

/**
 * 취득세(본세·지방교육세·농어촌특별세)와 중개보수(상한 기준, 부가세 포함) 추정.
 * 전제: `salePrice`는 만원 단위 양의 정수다. 과세표준과 거래금액은 매매가로 본다(스펙 가정 A4, A6).
 */
export function calculatePurchaseCosts(input: LoanInput, regulations: Regulations): PurchaseCosts {
  const { acquisitionTax: taxRules, brokerageFee: feeRules } = regulations.purchaseCosts;
  const acquisitionTax = calculateAcquisitionTax(input, taxRules);
  const brokerageFee = calculateBrokerageFee(input.salePrice, feeRules);
  return { acquisitionTax, brokerageFee, total: acquisitionTax.total + brokerageFee.total };
}

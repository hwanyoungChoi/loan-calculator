import { formatManwon } from "@/lib/utils/amount";
import { formatRateBp } from "@/lib/utils/formatRateBp";

import styles from "./ResultCard.module.css";
import ResultRow from "./ResultRow";

import type { LoanInput, PurchaseCosts } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type PurchaseCostRowsProps = {
  input: LoanInput;
  costs: PurchaseCosts;
  regulations: Regulations;
};

function describeRuralSpecialTax(input: LoanInput, ruralSpecialTax: number | null): string {
  if (input.isAreaOver85 !== true) return "농어촌특별세 비과세(85㎡ 이하)";
  if (ruralSpecialTax === null) return "농어촌특별세 미확인(다주택 중과분, 빼고 계산)";
  return `농어촌특별세 ${formatManwon(ruralSpecialTax)}`;
}

/** 결과 카드의 "취득세 등"과 "중개보수" 줄. 값은 합계이고 아래 줄에 항목과 세율을 숨기지 않고 보여 준다. */
function PurchaseCostRows({ input, costs, regulations }: PurchaseCostRowsProps) {
  const { acquisitionTax, brokerageFee } = costs;
  const { firstHomeReliefMax } = regulations.purchaseCosts.acquisitionTax;
  const taxLabel = acquisitionTax.isHeavy ? "다주택 중과" : "취득세";
  const feeBasis = brokerageFee.isCapped
    ? `한도 ${formatManwon(brokerageFee.fee)}`
    : `상한 ${formatRateBp(brokerageFee.rateBp)}`;

  return (
    <>
      <ResultRow
        label="취득세 등"
        value={formatManwon(acquisitionTax.total)}
        details={
          <>
            <span className={styles.detailLine}>
              {taxLabel} {formatRateBp(acquisitionTax.rateBp)} {formatManwon(acquisitionTax.tax)}
            </span>
            <span className={styles.detailLine}>
              지방교육세 {formatManwon(acquisitionTax.localEducationTax)}
            </span>
            <span className={styles.detailLine}>
              {describeRuralSpecialTax(input, acquisitionTax.ruralSpecialTax)}
            </span>
            {input.borrower === "firstHome" && (
              <span className={styles.detailLine}>
                생애최초 감면 대상이면 최대 {formatManwon(firstHomeReliefMax)} 줄어듭니다(미반영)
              </span>
            )}
          </>
        }
      />
      <ResultRow
        label="중개보수"
        value={formatManwon(brokerageFee.total)}
        details={`${feeBasis} 기준 추정 · 부가세 ${regulations.purchaseCosts.brokerageFee.vatPercent}% 포함`}
      />
    </>
  );
}

export default PurchaseCostRows;

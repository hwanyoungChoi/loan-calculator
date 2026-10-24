import { formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";

import { budgetExcess } from "../budgetExcess";
import styles from "./CompactListingSummary.module.css";
import MaskedValue from "./MaskedValue";

import type { Listing } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type CompactListingSummaryProps = {
  listing: Listing;
  regulations: Regulations;
  budget: number | null;
  isExpanded: boolean;
  /** 가리기 모드: 자기자금을 가린다 */
  isMasked: boolean;
};

/** 간단히 보기 한 줄의 내용: 이름(예산 초과 배지)과 필요한 자기자금, 펼침 표시. 줄 버튼과 끄는 동안 뜬 줄이 같이 쓴다. */
function CompactListingSummary({
  listing,
  regulations,
  budget,
  isExpanded,
  isMasked,
}: CompactListingSummaryProps) {
  const { ownFunds } = calculateLoan(listing, regulations);
  const isOverBudget = budgetExcess(ownFunds, budget) !== null;

  return (
    <span className={styles.summary}>
      <span className={styles.nameCell}>
        {isOverBudget && <span className={styles.overBadge}>초과</span>}
        <span className={styles.name}>{listing.name}</span>
      </span>
      <span className={styles.amount}>
        <MaskedValue isMasked={isMasked}>{formatManwonOrDash(ownFunds)}</MaskedValue>
      </span>
      <span className={isExpanded ? styles.chevronOpen : styles.chevron} aria-hidden="true">
        ▾
      </span>
    </span>
  );
}

export default CompactListingSummary;

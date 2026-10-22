import { PATHS } from "@/lib/constants/paths";
import { formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";

import { budgetExcess } from "../budgetExcess";
import styles from "./CompactListingRow.module.css";

import type { Listing } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type CompactListingRowProps = {
  listing: Listing;
  regulations: Regulations;
  /** 만원. null이면 예산 없음 */
  budget: number | null;
  onOpen: (listing: Listing) => void;
};

/** 간단히 보기의 한 줄: 이름과 필요한 자기자금. 누르면 카드 본문처럼 계산 화면으로 연다. */
function CompactListingRow({ listing, regulations, budget, onOpen }: CompactListingRowProps) {
  const { ownFunds } = calculateLoan(listing, regulations);
  const isOverBudget = budgetExcess(ownFunds, budget) !== null;

  return (
    <li>
      <a className={styles.row} href={PATHS.calculator} onClick={() => onOpen(listing)}>
        <span className={styles.nameCell}>
          {isOverBudget && <span className={styles.overBadge}>초과</span>}
          <span className={styles.name}>{listing.name}</span>
        </span>
        <span className={styles.amount}>{formatManwonOrDash(ownFunds)}</span>
      </a>
    </li>
  );
}

export default CompactListingRow;

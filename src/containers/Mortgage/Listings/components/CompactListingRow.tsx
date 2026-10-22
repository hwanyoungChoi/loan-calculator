import { useState, type ComponentProps } from "react";

import { formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";

import { budgetExcess } from "../budgetExcess";
import styles from "./CompactListingRow.module.css";
import ListingCard from "./ListingCard";

type CompactListingRowProps = ComponentProps<typeof ListingCard>;

/** 간단히 보기의 한 줄: 이름과 필요한 자기자금. 누르면 아래로 상세 카드를 펼치고, 다시 누르면 접는다. */
function CompactListingRow(props: CompactListingRowProps) {
  const { listing, regulations, budget } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const { ownFunds } = calculateLoan(listing, regulations);
  const isOverBudget = budgetExcess(ownFunds, budget) !== null;

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((isOpen) => !isOpen)}
      >
        <span className={styles.nameCell}>
          {isOverBudget && <span className={styles.overBadge}>초과</span>}
          <span className={styles.name}>{listing.name}</span>
        </span>
        <span className={styles.amount}>{formatManwonOrDash(ownFunds)}</span>
        <span className={isExpanded ? styles.chevronOpen : styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>
      {isExpanded && (
        <div className={styles.detail}>
          <ListingCard {...props} />
        </div>
      )}
    </li>
  );
}

export default CompactListingRow;

import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import styles from "./SharedListingRow.module.css";

import type { Regulations } from "@/lib/types/regulation";
import type { ShareListing } from "@/lib/types/share";

type SharedListingRowProps = {
  listing: ShareListing;
  regulations: Regulations;
};

/** 공유받은 매물 한 줄: 이름, 조건, 매매가·KB시세, 현재 규제로 다시 계산한 필요한 자기자금(ADR-007) */
function SharedListingRow({ listing, regulations }: SharedListingRowProps) {
  const { ownFunds } = calculateLoan(listing, regulations);

  return (
    <li className={styles.row}>
      <strong className={styles.name}>{listing.name}</strong>
      <span className={styles.condition}>
        {describeCondition(listing.region, listing.borrower, listing.customLtvRate)}
      </span>
      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt>매매가</dt>
          <dd>{formatManwon(listing.salePrice)}</dd>
        </div>
        <div className={styles.figure}>
          <dt>KB시세</dt>
          <dd>{formatManwon(listing.kbPrice)}</dd>
        </div>
        <div className={styles.emphasisFigure}>
          <dt>필요한 자기자금</dt>
          <dd>{formatManwonOrDash(ownFunds)}</dd>
        </div>
      </dl>
    </li>
  );
}

export default SharedListingRow;

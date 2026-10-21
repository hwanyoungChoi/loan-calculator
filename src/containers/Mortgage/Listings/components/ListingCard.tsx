import { PATHS } from "@/lib/constants/paths";
import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import styles from "./ListingCard.module.css";

import type { Listing } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type ListingCardProps = {
  listing: Listing;
  regulations: Regulations;
  onOpen: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
};

/** 핵심 지표 3개(매매가, 예상 한도, 자기자금)와 조건 요약. 누르면 계산 화면으로 연다. */
function ListingCard({ listing, regulations, onOpen, onDelete }: ListingCardProps) {
  const result = calculateLoan(listing, regulations);

  return (
    <li className={styles.card}>
      <a className={styles.link} href={PATHS.calculator} onClick={() => onOpen(listing)}>
        <span className={styles.heading}>
          <strong className={styles.name}>{listing.name}</strong>
          {result.status === "unconfirmed" && <span className={styles.badge}>계산 불가</span>}
        </span>
        <span className={styles.condition}>
          {describeCondition(listing.region, listing.borrower)}
        </span>
        <dl className={styles.figures}>
          <div className={styles.figure}>
            <dt>매매가</dt>
            <dd>{formatManwon(listing.salePrice)}</dd>
          </div>
          <div className={styles.figure}>
            <dt>예상 한도</dt>
            <dd>{formatManwonOrDash(result.loanLimit)}</dd>
          </div>
          <div className={styles.emphasisFigure}>
            <dt>필요한 자기자금</dt>
            <dd>{formatManwonOrDash(result.ownFunds)}</dd>
          </div>
        </dl>
      </a>
      <button
        type="button"
        className={styles.deleteButton}
        aria-label={`${listing.name} 삭제`}
        onClick={() => onDelete(listing)}
      >
        삭제
      </button>
    </li>
  );
}

export default ListingCard;

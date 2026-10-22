import { PATHS } from "@/lib/constants/paths";
import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan, hasUnconfirmedOwnFunds } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import styles from "./ListingCard.module.css";

import type { Listing } from "@/lib/types/listing";
import type { LoanResult } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type ListingCardProps = {
  listing: Listing;
  regulations: Regulations;
  onOpen: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
};

/** 계산하지 못한 매물 배지. 상태가 늘면 여기 등록하지 않은 것이 타입 검사에서 걸린다. */
const STATUS_BADGES: Record<LoanResult["status"], string | null> = {
  ok: null,
  unconfirmed: "계산 불가",
  ineligible: "계산 불가 · 요건 미충족",
};

/**
 * 핵심 지표 3개(매매가, 예상 한도, 자기자금)와 조건 요약. 본문을 누르거나 "수정"을 누르면 계산 화면으로 연다.
 * 본문 링크와 버튼 영역은 형제라 인터랙티브 요소가 겹치지 않는다(ADR-022 D7).
 */
function ListingCard({ listing, regulations, onOpen, onDelete }: ListingCardProps) {
  // 1차 형식(customLtvRate 키 없음) 매물도 그대로 넘긴다. 키가 없으면 규제 LTV로 계산된다(ADR-012).
  const result = calculateLoan(listing, regulations);
  const statusBadge = STATUS_BADGES[result.status];
  const isCustomLtv = result.appliedLtv?.source === "custom";

  return (
    <li className={styles.card}>
      <a className={styles.link} href={PATHS.calculator} onClick={() => onOpen(listing)}>
        <span className={styles.heading}>
          <strong className={styles.name}>{listing.name}</strong>
          {statusBadge !== null && <span className={styles.badge}>{statusBadge}</span>}
          {isCustomLtv && <span className={styles.customBadge}>사용자 지정</span>}
          {hasUnconfirmedOwnFunds(result) && <span className={styles.badge}>농특세 미확인</span>}
        </span>
        <span className={styles.condition}>
          {describeCondition(listing.region, listing.borrower, listing.customLtvRate)}
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
      <div className={styles.actions}>
        <a
          className={styles.editButton}
          href={PATHS.calculator}
          aria-label={`${listing.name} 수정`}
          onClick={() => onOpen(listing)}
        >
          수정
        </a>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`${listing.name} 삭제`}
          onClick={() => onDelete(listing)}
        >
          삭제
        </button>
      </div>
    </li>
  );
}

export default ListingCard;

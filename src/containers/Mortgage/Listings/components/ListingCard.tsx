import { useState } from "react";

import { PATHS } from "@/lib/constants/paths";
import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan, hasUnconfirmedOwnFunds } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import { budgetExcess, budgetLeft } from "../budgetExcess";
import styles from "./ListingCard.module.css";
import MemoEditor from "./MemoEditor";

import type { Listing, ListingWriteResult } from "@/lib/types/listing";
import type { LoanResult } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type ListingCardProps = {
  listing: Listing;
  regulations: Regulations;
  /** 만원. null이면 예산 없음 */
  budget: number | null;
  onOpen: (listing: Listing) => void;
  onCopy: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
  onSaveMemo: (listing: Listing, memo: string) => ListingWriteResult;
};

/** 계산하지 못한 매물 배지. 상태가 늘면 여기 등록하지 않은 것이 타입 검사에서 걸린다. */
const STATUS_BADGES: Record<LoanResult["status"], string | null> = {
  ok: null,
  unconfirmed: "계산 불가",
  ineligible: "계산 불가 · 요건 미충족",
};

/**
 * 핵심 지표 3개(매매가, 예상 한도, 자기자금)와 조건 요약. 계산된 매물은 자기자금 아래에 내역(집값 중 내 돈, 취득세 등, 중개보수)을 작게 붙인다. 본문을 누르거나 "수정"을 누르면 계산 화면으로 열고, "복사"는 같은 값을 새 매물로 연다.
 * 예산을 넘으면 이름 앞에 "초과"와 넘는 금액을, 예산 안이면 남는 금액을 보이고, 메모가 있으면 아래에 두 줄까지 보이고 "메모"로 카드 안에서 고친다.
 * 본문 링크와 버튼 영역은 형제라 인터랙티브 요소가 겹치지 않는다(ADR-022 D7). 목록의 `<li>`는 부모가 감싼다(상세히 보기, 간단히 보기의 펼침).
 */
function ListingCard({
  listing,
  regulations,
  budget,
  onOpen,
  onCopy,
  onDelete,
  onSaveMemo,
}: ListingCardProps) {
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  // 1차 형식(customLtvRate 키 없음) 매물도 그대로 넘긴다. 키가 없으면 규제 LTV로 계산된다(ADR-012).
  const result = calculateLoan(listing, regulations);
  const statusBadge = STATUS_BADGES[result.status];
  const isCustomLtv = result.appliedLtv?.source === "custom";
  const excess = budgetExcess(result.ownFunds, budget);
  const left = budgetLeft(result.ownFunds, budget);
  const memo = listing.memo ?? "";

  return (
    <article className={styles.card}>
      <a className={styles.link} href={PATHS.calculator} onClick={() => onOpen(listing)}>
        <span className={styles.heading}>
          {excess !== null && <span className={styles.overBadge}>초과</span>}
          <strong className={styles.name}>{listing.name}</strong>
          {statusBadge !== null && <span className={styles.badge}>{statusBadge}</span>}
          {isCustomLtv && <span className={styles.customBadge}>사용자 지정</span>}
          {hasUnconfirmedOwnFunds(result) && <span className={styles.badge}>농특세 미확인</span>}
        </span>
        <span className={styles.condition}>
          {describeCondition(listing.region, listing.borrower, listing.customLtvRate)}
        </span>
        {excess !== null && (
          <span className={styles.overNote}>예산보다 {formatManwon(excess)} 많음</span>
        )}
        {left !== null && (
          <span className={styles.leftNote}>
            {left === 0 ? "예산에 딱 맞음" : `예산에서 ${formatManwon(left)} 남음`}
          </span>
        )}
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
          {result.status === "ok" && (
            <>
              <div className={styles.breakdown}>
                <dt>집값 중 내 돈</dt>
                <dd>{formatManwon(result.downPayment)}</dd>
              </div>
              <div className={styles.breakdown}>
                <dt>{hasUnconfirmedOwnFunds(result) ? "취득세 등(농특세 제외)" : "취득세 등"}</dt>
                <dd>{formatManwon(result.purchaseCosts.acquisitionTax.total)}</dd>
              </div>
              <div className={styles.breakdown}>
                <dt>중개보수</dt>
                <dd>{formatManwon(result.purchaseCosts.brokerageFee.total)}</dd>
              </div>
            </>
          )}
        </dl>
      </a>
      {memo !== "" && !isMemoOpen && <p className={styles.memo}>{memo}</p>}
      <div className={styles.actions}>
        <a
          className={styles.editButton}
          href={PATHS.calculator}
          aria-label={`${listing.name} 수정`}
          onClick={() => onOpen(listing)}
        >
          수정
        </a>
        <a
          className={styles.copyButton}
          href={PATHS.calculator}
          aria-label={`${listing.name} 복사`}
          onClick={() => onCopy(listing)}
        >
          복사
        </a>
        <button
          type="button"
          className={styles.memoButton}
          aria-label={`${listing.name} 메모`}
          aria-expanded={isMemoOpen}
          onClick={() => setIsMemoOpen((isOpen) => !isOpen)}
        >
          메모
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`${listing.name} 삭제`}
          onClick={() => onDelete(listing)}
        >
          삭제
        </button>
      </div>
      {isMemoOpen && (
        <MemoEditor
          listingName={listing.name}
          initialMemo={memo}
          onSave={(nextMemo) => onSaveMemo(listing, nextMemo)}
          onClose={() => setIsMemoOpen(false)}
        />
      )}
    </article>
  );
}

export default ListingCard;

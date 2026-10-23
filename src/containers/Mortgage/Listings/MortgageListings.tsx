import { useEffect, useRef, useState } from "react";

import ChoiceGroup from "@/components/ChoiceGroup";
import { useListingSource } from "@/hooks/useListingSource";
import { useOpenSheet } from "@/hooks/useOpenSheet";
import { PATHS } from "@/lib/constants/paths";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { copiedListingName, listingToCopyDraft, listingToDraft } from "@/lib/utils/listingDraft";
import { sortListings } from "@/lib/utils/sortListings";

import styles from "./MortgageListings.module.css";
import { budgetExcess } from "./budgetExcess";
import AccountBar from "./components/AccountBar";
import BudgetBar from "./components/BudgetBar";
import CompactListingRow from "./components/CompactListingRow";
import CorruptListingsNotice from "./components/CorruptListingsNotice";
import ListingCard from "./components/ListingCard";
import ShareSheet, { type ShareTarget } from "./components/ShareSheet";
import { useBudget } from "./hooks/useBudget";
import { useListingsScrollRestoration } from "./hooks/useListingsScrollRestoration";

import type { BudgetStore } from "@/lib/types/budget";
import type { DraftStore } from "@/lib/types/draft";
import type {
  Listing,
  ListingSort,
  ListingSourceWriteFailure,
  ListingStore,
  ListingView,
} from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";
import type { LoginResult } from "@/lib/types/route";
import type { SentShareStore } from "@/lib/types/sentShare";
import type { SessionHintStore } from "@/lib/types/sessionHint";

type MortgageListingsProps = {
  /** 로그아웃 상태의 목록 원본 */
  listingStore: ListingStore;
  sessionHintStore: SessionHintStore;
  draftStore: DraftStore;
  budgetStore: BudgetStore;
  sentShareStore: SentShareStore;
  regulations: Regulations;
  /** 주소(`#/listings?sort=`)에서 읽은 정렬. 정렬의 단일 출처다. */
  sort: ListingSort;
  /** 주소(`#/listings?view=`)에서 읽은 보기. */
  view: ListingView;
  /** 카카오 로그인에서 돌아온 결과(`#/listings?login=`). 한 번 잡아 계정 줄에 보이고 주소에서 지운다. */
  login: LoginResult | undefined;
  /** 저장 시트 이름 제안을 바꾼다. 복사는 "원래 이름 (복사)", 열기는 비운다. */
  onSuggestedNameChange: (name: string) => void;
  /** 다른 화면이 남긴 알림(공유받은 매물 추가 등). 들어올 때 한 번만 보인다. */
  notice: string | null;
  onNoticeChange: (notice: string | null) => void;
};

const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "ownFunds", label: "자기자금순" },
  { value: "recent", label: "최근 저장순" },
  { value: "name", label: "가나다순" },
];

const VIEW_OPTIONS: { value: ListingView; label: string }[] = [
  { value: "card", label: "상세히" },
  { value: "compact", label: "간단히" },
];

/**
 * notFound는 다른 탭에서 이미 지운 경우라 목록이 그대로 맞으므로 알리지 않는다.
 * unauthorized는 계정 줄이 "로그인이 끝났습니다"로 알린다. 상한(limit)은 삭제에서 생기지 않는다.
 */
const DELETE_FAILURE_MESSAGES: Record<ListingSourceWriteFailure["reason"], string | null> = {
  unavailable: "삭제하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다",
  corrupt: "저장된 목록이 손상되어 삭제할 수 없습니다",
  notFound: null,
  notReady: "계정 상태를 확인한 뒤 다시 시도해 주세요",
  unauthorized: null,
  deletedElsewhere: "다른 기기에서 삭제된 매물입니다",
  limit: "삭제하지 못했습니다. 다시 시도해 주세요",
  network: "삭제하지 못했습니다. 연결을 확인하고 다시 시도해 주세요",
};

const UNAVAILABLE_MESSAGE = "이 브라우저에서는 저장소를 사용할 수 없어 저장 목록을 쓸 수 없습니다";

/** 저장 매물 목록. 결과는 저장하지 않고 현재 규제로 다시 계산해 보여준다(ADR-007). */
function MortgageListings({
  listingStore,
  sessionHintStore,
  draftStore,
  budgetStore,
  sentShareStore,
  regulations,
  sort,
  view,
  login,
  onSuggestedNameChange,
  notice,
  onNoticeChange,
}: MortgageListingsProps) {
  const source = useListingSource({ listingStore, sessionHintStore });
  const { list } = source;
  const budget = useBudget(budgetStore);
  const [writeError, setWriteError] = useState<string | null>(null);
  const sheet = useOpenSheet<ShareTarget>();
  const shareListButtonRef = useRef<HTMLButtonElement>(null);
  // 알림은 잡아 둔 뒤 위에서 비운다. 다른 화면을 거쳐 돌아와도 다시 뜨지 않는다.
  const [shownNotice] = useState(notice);
  // 로그인 결과도 한 번 잡은 뒤 주소에서 지운다. 새로고침해도 안내가 다시 뜨지 않는다.
  const [loginResult] = useState(login);
  useListingsScrollRestoration();

  useEffect(() => {
    if (notice !== null) onNoticeChange(null);
  }, [notice, onNoticeChange]);

  useEffect(() => {
    if (login !== undefined) window.location.replace(PATHS.listings(sort, view));
  }, [login, sort, view]);

  const sortedListings = list.status === "ok" ? sortListings(list.listings, sort, regulations) : [];

  /** 정렬·보기는 새로고침해도 남게 주소에 두고, 바꿀 때 히스토리는 쌓지 않는다. */
  const handleSortChange = (nextSort: ListingSort) => {
    window.location.replace(PATHS.listings(nextSort, view));
  };

  const handleViewChange = (nextView: ListingView) => {
    window.location.replace(PATHS.listings(sort, nextView));
  };

  /** 카드 본문·"수정" 링크가 `#/`로 push하기 전에 draft를 이 매물로 바꾼다(ADR-004). */
  const handleOpen = (listing: Listing) => {
    draftStore.update(listingToDraft(listing));
    onSuggestedNameChange("");
  };

  /** "복사" 링크가 `#/`로 push하기 전에 draft를 이 매물 값의 새 매물로 바꾸고 이름을 제안한다. 원본은 그대로다. */
  const handleCopy = (listing: Listing) => {
    draftStore.update(listingToCopyDraft(listing));
    onSuggestedNameChange(copiedListingName(listing.name));
  };

  /**
   * 메모만 바꾼다. 로그인이 끝나(401) 서버 매물 카드가 사라져도 쓰던 메모를 잃지 않게 목록 위에 남긴다.
   */
  const handleSaveMemo = async (listing: Listing, memo: string) => {
    const result = await source.updateMemo(listing, memo);
    if (!result.ok && result.reason === "unauthorized" && memo !== "") {
      setWriteError(`'${listing.name}' 메모를 저장하지 못했습니다. 쓰던 메모: ${memo}`);
    }
    return result;
  };

  const handleDelete = async (listing: Listing) => {
    if (!window.confirm(`'${listing.name}' 매물을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const result = await source.remove(listing.id);
    setWriteError(result.ok ? null : DELETE_FAILURE_MESSAGES[result.reason]);
  };

  /** 시트는 연 시점의 매물을 담는다(링크는 만든 시점의 스냅샷). */
  const handleShare = (listing: Listing, button: HTMLButtonElement) => {
    sheet.open({ kind: "listing", listings: [listing] }, button);
  };

  const handleShareList = () => {
    sheet.open({ kind: "list", listings: sortedListings }, shareListButtonRef.current);
  };

  const renderBody = () => {
    // 출처가 정해지기 전에는 로컬 목록을 먼저 그리지 않는다(서버 목록으로 바뀌며 깜빡이지 않게).
    if (list.status === "loading") {
      return (
        <p className={styles.notice} aria-busy="true">
          저장 목록을 불러오는 중
        </p>
      );
    }
    // 계정 줄이 안내와 [다시 시도]를 보인다. 로컬 목록으로 대신 보이지 않는다.
    if (list.status === "accountError") return null;
    if (list.status === "loadFailed") {
      return (
        <div className={styles.notice}>
          <p role="alert">목록을 불러오지 못했습니다</p>
          <button
            type="button"
            className={styles.retryButton}
            disabled={source.isRetrying}
            onClick={source.retry}
          >
            다시 시도
          </button>
        </div>
      );
    }
    if (list.status === "unavailable") {
      return <p className={styles.notice}>{UNAVAILABLE_MESSAGE}</p>;
    }
    if (list.status === "corrupt") {
      return <CorruptListingsNotice rawText={list.rawText} onReset={() => listingStore.reset()} />;
    }
    if (list.listings.length === 0) {
      return (
        <div className={styles.empty}>
          <p>저장한 매물이 없습니다</p>
          <a className={styles.emptyAction} href={PATHS.calculator}>
            계산하러 가기
          </a>
        </div>
      );
    }
    const overBudgetCount = sortedListings.filter(
      (listing) => budgetExcess(calculateLoan(listing, regulations).ownFunds, budget) !== null,
    ).length;
    const listLabel = `저장한 매물 ${sortedListings.length}개`;
    return (
      <>
        <BudgetBar budget={budget} overBudgetCount={overBudgetCount} onChange={budgetStore.set} />
        <ChoiceGroup
          name="listingSort"
          legend="정렬"
          options={SORT_OPTIONS}
          value={sort}
          columns={3}
          onChange={handleSortChange}
        />
        <ChoiceGroup
          name="listingView"
          legend="보기"
          options={VIEW_OPTIONS}
          value={view}
          columns={2}
          onChange={handleViewChange}
        />
        {source.isRefreshFailed && (
          <p className={styles.warning}>
            최신 목록을 불러오지 못했습니다. 마지막으로 불러온 목록입니다
          </p>
        )}
        {view === "compact" ? (
          <div className={styles.compactTable}>
            <div className={styles.compactHeader} aria-hidden="true">
              <span>이름</span>
              <span>필요한 자기자금</span>
            </div>
            <ul aria-label={listLabel}>
              {sortedListings.map((listing) => (
                <CompactListingRow
                  key={listing.id}
                  listing={listing}
                  regulations={regulations}
                  budget={budget}
                  onOpen={handleOpen}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onSaveMemo={handleSaveMemo}
                />
              ))}
            </ul>
          </div>
        ) : (
          <ul className={styles.list} aria-label={listLabel}>
            {sortedListings.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  regulations={regulations}
                  budget={budget}
                  onOpen={handleOpen}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onSaveMemo={handleSaveMemo}
                />
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  // 시트가 열린 동안 뒤 화면은 inert로 키보드·보조기기에서 빼낸다(aria-modal이 약속하는 동작).
  return (
    <>
      <div className={styles.page} inert={sheet.isOpen}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>저장 목록</h1>
            {sortedListings.length > 0 && (
              <button
                ref={shareListButtonRef}
                type="button"
                className={styles.shareListButton}
                onClick={handleShareList}
              >
                목록 공유
              </button>
            )}
          </div>
          <p className={styles.baseDate}>
            규제 기준일 {regulations.baseDate} · 현재 규제로 다시 계산한 값입니다
          </p>
        </header>
        <AccountBar
          status={source.status}
          loginResult={loginResult}
          isSessionExpired={source.isSessionExpired}
          sessionHintStore={sessionHintStore}
          onRetry={source.retry}
          isRetrying={source.isRetrying}
        />
        {shownNotice !== null && (
          <p role="status" className={styles.addedNotice}>
            {shownNotice}
          </p>
        )}
        {/* 로그인이 끝나 서버 목록이 로컬 목록으로 바뀌어도 남도록 목록 밖에 둔다. */}
        {writeError !== null && (
          <p role="alert" className={styles.error}>
            {writeError}
          </p>
        )}
        {renderBody()}
      </div>
      {sheet.openSheet !== null && (
        <ShareSheet
          target={sheet.openSheet}
          sentShareStore={sentShareStore}
          onClose={sheet.close}
        />
      )}
    </>
  );
}

export default MortgageListings;

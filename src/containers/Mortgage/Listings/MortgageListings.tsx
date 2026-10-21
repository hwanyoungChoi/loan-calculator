import { useState } from "react";

import ChoiceGroup from "@/components/ChoiceGroup";
import { useListings } from "@/hooks/useListings";
import { PATHS } from "@/lib/constants/paths";
import { listingToDraft } from "@/lib/utils/listingDraft";
import { sortListings } from "@/lib/utils/sortListings";

import styles from "./MortgageListings.module.css";
import CorruptListingsNotice from "./components/CorruptListingsNotice";
import ListingCard from "./components/ListingCard";
import { useListingsScrollRestoration } from "./hooks/useListingsScrollRestoration";

import type { DraftStore } from "@/lib/types/draft";
import type { Listing, ListingSort, ListingStore, ListingWriteFailure } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type MortgageListingsProps = {
  listingStore: ListingStore;
  draftStore: DraftStore;
  regulations: Regulations;
  /** 주소(`#/listings?sort=`)에서 읽은 정렬. 정렬의 단일 출처다. */
  sort: ListingSort;
};

const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "ownFunds", label: "자기자금순" },
  { value: "recent", label: "최근 저장순" },
];

/** notFound는 다른 탭에서 이미 지운 경우라 목록이 그대로 맞으므로 알리지 않는다. */
const DELETE_FAILURE_MESSAGES: Record<ListingWriteFailure["reason"], string | null> = {
  unavailable: "삭제하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다",
  corrupt: "저장된 목록이 손상되어 삭제할 수 없습니다",
  notFound: null,
};

const UNAVAILABLE_MESSAGE = "이 브라우저에서는 저장소를 사용할 수 없어 저장 목록을 쓸 수 없습니다";

/** 저장 매물 목록. 결과는 저장하지 않고 현재 규제로 다시 계산해 보여준다(ADR-007). */
function MortgageListings({ listingStore, draftStore, regulations, sort }: MortgageListingsProps) {
  const snapshot = useListings(listingStore);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  useListingsScrollRestoration();

  /** 정렬은 새로고침해도 남게 주소에 두고, 바꿀 때 히스토리는 쌓지 않는다. */
  const handleSortChange = (nextSort: ListingSort) => {
    window.location.replace(PATHS.listings(nextSort));
  };

  /** 카드 링크가 `#/`로 push하기 전에 draft를 이 매물로 바꾼다(ADR-004). */
  const handleOpen = (listing: Listing) => {
    draftStore.update(listingToDraft(listing));
  };

  const handleDelete = (listing: Listing) => {
    if (!window.confirm(`'${listing.name}' 매물을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const result = listingStore.remove(listing.id);
    setDeleteError(result.ok ? null : DELETE_FAILURE_MESSAGES[result.reason]);
  };

  const renderBody = () => {
    if (snapshot.status === "unavailable") {
      return <p className={styles.notice}>{UNAVAILABLE_MESSAGE}</p>;
    }
    if (snapshot.status === "corrupt") {
      return (
        <CorruptListingsNotice rawText={snapshot.rawText} onReset={() => listingStore.reset()} />
      );
    }
    if (snapshot.listings.length === 0) {
      return (
        <div className={styles.empty}>
          <p>저장한 매물이 없습니다</p>
          <a className={styles.emptyAction} href={PATHS.calculator}>
            계산하러 가기
          </a>
        </div>
      );
    }
    const sortedListings = sortListings(snapshot.listings, sort, regulations);
    return (
      <>
        <ChoiceGroup
          name="listingSort"
          legend="정렬"
          options={SORT_OPTIONS}
          value={sort}
          columns={2}
          onChange={handleSortChange}
        />
        {deleteError !== null && (
          <p role="alert" className={styles.error}>
            {deleteError}
          </p>
        )}
        <ul className={styles.list} aria-label={`저장한 매물 ${sortedListings.length}개`}>
          {sortedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              regulations={regulations}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>저장 목록</h1>
        <p className={styles.baseDate}>
          규제 기준일 {regulations.baseDate} · 현재 규제로 다시 계산한 값입니다
        </p>
      </header>
      {renderBody()}
    </div>
  );
}

export default MortgageListings;

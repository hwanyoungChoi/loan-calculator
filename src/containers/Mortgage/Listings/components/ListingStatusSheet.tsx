import Sheet from "@/components/Sheet";
import { LISTING_STATUSES } from "@/lib/constants/listingStatus";

import ListingStatusChip from "./ListingStatusChip";
import styles from "./ListingStatusSheet.module.css";

import type { Listing, ListingStatus } from "@/lib/types/listing";

type ListingStatusSheetProps = {
  /** 시트를 연 시점의 매물 */
  listing: Listing;
  /** null이면 상태를 지운다(미지정) */
  onSelect: (status: ListingStatus | null) => void;
  onClose: () => void;
};

/** 후보·보류·비후보·지우기 고르기. 지금 상태는 눌린 버튼(aria-pressed)으로 보인다. 지우기는 상태가 있을 때만 있다. */
function ListingStatusSheet({ listing, onSelect, onClose }: ListingStatusSheetProps) {
  return (
    <Sheet title={`'${listing.name}' 상태`} onClose={onClose}>
      <div className={styles.options}>
        {LISTING_STATUSES.map((status) => {
          const isCurrent = listing.status === status;
          return (
            <button
              key={status}
              type="button"
              className={styles.option}
              aria-pressed={isCurrent}
              onClick={() => onSelect(status)}
            >
              <ListingStatusChip status={status} />
              {isCurrent && <span className={styles.current}>지금 상태</span>}
            </button>
          );
        })}
        {listing.status !== undefined && (
          <button type="button" className={styles.clearButton} onClick={() => onSelect(null)}>
            상태 지우기
          </button>
        )}
      </div>
    </Sheet>
  );
}

export default ListingStatusSheet;

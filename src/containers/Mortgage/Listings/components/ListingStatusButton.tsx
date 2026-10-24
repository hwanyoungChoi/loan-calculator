import { LISTING_STATUS_LABELS } from "@/lib/constants/listingStatus";

import ListingStatusChip from "./ListingStatusChip";
import chipStyles from "./ListingStatusChip.module.css";

import type { Listing } from "@/lib/types/listing";

type ListingStatusButtonProps = {
  listing: Listing;
  /** 누르는 자리의 크기·위치. 칩 모양은 이 컴포넌트가 그린다. */
  className: string;
  /** 상태 고르기 시트를 연다 */
  onClick: (button: HTMLButtonElement) => void;
};

/** 이름 앞의 상태 칩 버튼. 미지정이면 칩 대신 작은 [상태]를 보인다. 누르면 고르기 시트가 뜬다. */
function ListingStatusButton({ listing, className, onClick }: ListingStatusButtonProps) {
  const { status } = listing;
  const label =
    status === undefined
      ? `${listing.name} 상태 정하기`
      : `${listing.name} 상태 ${LISTING_STATUS_LABELS[status]}, 바꾸기`;
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => onClick(event.currentTarget)}
    >
      {status === undefined ? (
        <span className={chipStyles.unset}>상태</span>
      ) : (
        <ListingStatusChip status={status} />
      )}
    </button>
  );
}

export default ListingStatusButton;

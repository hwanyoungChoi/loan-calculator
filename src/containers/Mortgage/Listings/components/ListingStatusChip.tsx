import { LISTING_STATUS_LABELS } from "@/lib/constants/listingStatus";

import styles from "./ListingStatusChip.module.css";

import type { ListingStatus } from "@/lib/types/listing";

/** 상태별 모양. 상태가 늘면 여기 등록하지 않은 것이 타입 검사에서 걸린다. */
const CHIP_CLASSES: Record<ListingStatus, string> = {
  candidate: styles.candidate,
  hold: styles.hold,
  rejected: styles.rejected,
};

/**
 * 이름 맨 앞의 상태 표시(ADR-027). 후보는 강조색으로 채우고, 보류는 옅은 회색, 비후보는 테두리만 두른 흐린 글자다.
 * 모양만 그린다. 누르는 자리(버튼)는 쓰는 쪽이 감싼다(간단히 보기의 끄는 줄 안에도 그려야 해서).
 */
function ListingStatusChip({ status }: { status: ListingStatus }) {
  return <span className={CHIP_CLASSES[status]}>{LISTING_STATUS_LABELS[status]}</span>;
}

export default ListingStatusChip;

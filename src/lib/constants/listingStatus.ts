// 매물 상태 값과 라벨(ADR-027). 공유 검증(server/)의 전이 의존이라 `@/` 별칭·DOM 타입을 쓰지 않는다.
import type { ListingStatus } from "../types/listing";

/** 화면에 보이는 순서 */
export const LISTING_STATUSES: ListingStatus[] = ["candidate", "hold", "rejected"];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  candidate: "후보",
  hold: "보류",
  rejected: "비후보",
};

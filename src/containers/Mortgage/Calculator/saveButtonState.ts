import { isSameAsListing } from "@/lib/utils/listingDraft";

import type { Listing, ListingSnapshot } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

type SaveStatus = "ready" | "saved" | "invalidInput" | "corrupt" | "unavailable";

export type SaveButtonState = {
  label: string;
  isDisabled: boolean;
  /** 버튼 옆에 붙이는 비활성 이유. 입력 오류는 필드 아래에 이미 보이므로 따로 쓰지 않는다. */
  message: string | null;
};

const SAVE_BUTTON_STATES: Record<SaveStatus, SaveButtonState> = {
  ready: { label: "저장", isDisabled: false, message: null },
  saved: { label: "저장됨", isDisabled: true, message: null },
  invalidInput: { label: "저장", isDisabled: true, message: null },
  corrupt: {
    label: "저장",
    isDisabled: true,
    message: "저장된 목록이 손상되어 저장할 수 없습니다(목록 화면에서 초기화)",
  },
  unavailable: { label: "저장", isDisabled: true, message: "이 브라우저에서는 저장할 수 없습니다" },
};

type SaveButtonInput = {
  listingsStatus: ListingSnapshot["status"];
  /** 두 금액이 모두 유효할 때만 값이 있다 */
  loanInput: LoanInput | null;
  /** draft.listingId가 가리키는 저장본(목록에 없으면 null) */
  editingListing: Listing | null;
};

function selectSaveStatus({
  listingsStatus,
  loanInput,
  editingListing,
}: SaveButtonInput): SaveStatus {
  if (listingsStatus !== "ok") return listingsStatus;
  if (loanInput === null) return "invalidInput";
  if (editingListing !== null && isSameAsListing(loanInput, editingListing)) return "saved";
  return "ready";
}

export function getSaveButtonState(input: SaveButtonInput): SaveButtonState {
  return SAVE_BUTTON_STATES[selectSaveStatus(input)];
}

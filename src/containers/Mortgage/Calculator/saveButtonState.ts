import { isSameAsListing } from "@/lib/utils/listingDraft";

import type { Listing, ListingListState } from "@/lib/types/listing";
import type { LoanInput } from "@/lib/types/loan";

type SaveStatus =
  "ready" | "changed" | "saved" | "invalidInput" | Exclude<ListingListState["status"], "ok">;

export type SaveButtonState = {
  label: string;
  isDisabled: boolean;
  /** 버튼 옆에 붙이는 비활성 이유. 입력 오류는 필드 아래에 이미 보이므로 따로 쓰지 않는다. */
  message: string | null;
};

const SAVE_BUTTON_STATES: Record<SaveStatus, SaveButtonState> = {
  ready: { label: "저장", isDisabled: false, message: null },
  // 불러온 매물을 고친 상태. 누르면 덮어쓰기 시트가 열린다(ADR-022 D7)
  changed: { label: "변경 저장", isDisabled: false, message: null },
  saved: { label: "저장됨", isDisabled: true, message: null },
  invalidInput: { label: "저장", isDisabled: true, message: null },
  corrupt: {
    label: "저장",
    isDisabled: true,
    message: "저장된 목록이 손상되어 저장할 수 없습니다(목록 화면에서 초기화)",
  },
  unavailable: { label: "저장", isDisabled: true, message: "이 브라우저에서는 저장할 수 없습니다" },
  // 출처(로컬/계정)가 정해지기 전에 저장하면 로그인 사용자의 매물이 로컬로 가거나 편집 중인 매물이 복제된다.
  loading: { label: "저장", isDisabled: true, message: "저장 목록을 불러오는 중입니다" },
  accountError: {
    label: "저장",
    isDisabled: true,
    message: "계정 상태를 확인하지 못해 저장할 수 없습니다(저장 목록 화면에서 다시 시도)",
  },
  loadFailed: {
    label: "저장",
    isDisabled: true,
    message: "저장 목록을 불러오지 못해 저장할 수 없습니다(저장 목록 화면에서 다시 시도)",
  },
};

type SaveButtonInput = {
  listingsStatus: ListingListState["status"];
  /** 두 금액이 모두 유효할 때만 값이 있다 */
  loanInput: LoanInput | null;
  /** draft.listingId가 가리키는 저장본(목록에 없으면 null) */
  editingListing: Listing | null;
};

/** 저장 버튼과 저장 시트 안내가 함께 쓰는 판단. 저장본과 같은지는 `isSameAsListing` 하나로 본다. */
export function selectSaveStatus({
  listingsStatus,
  loanInput,
  editingListing,
}: SaveButtonInput): SaveStatus {
  if (listingsStatus !== "ok") return listingsStatus;
  if (loanInput === null) return "invalidInput";
  if (editingListing === null) return "ready";
  return isSameAsListing(loanInput, editingListing) ? "saved" : "changed";
}

export function getSaveButtonState(input: SaveButtonInput): SaveButtonState {
  return SAVE_BUTTON_STATES[selectSaveStatus(input)];
}

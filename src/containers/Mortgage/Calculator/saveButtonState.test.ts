import { describe, expect, it } from "vitest";

import { makeListing } from "@/test/listingFixture";

import { getSaveButtonState } from "./saveButtonState";

import type { LoanInput } from "@/lib/types/loan";

const INPUT: LoanInput = {
  salePrice: 125000,
  kbPrice: 120000,
  region: "regulated",
  borrower: "noHome",
};

const SAVED = makeListing({ ...INPUT, id: "a" });

describe("getSaveButtonState (계산 화면 저장 버튼)", () => {
  it("두 금액이 유효하고 저장소가 정상이면 활성 '저장'", () => {
    expect(
      getSaveButtonState({ listingsStatus: "ok", loanInput: INPUT, editingListing: null }),
    ).toEqual({ label: "저장", isDisabled: false, message: null });
  });

  it("금액이 하나라도 유효하지 않으면 비활성 '저장'(이유는 필드 아래 오류로 보인다)", () => {
    expect(
      getSaveButtonState({ listingsStatus: "ok", loanInput: null, editingListing: null }),
    ).toEqual({ label: "저장", isDisabled: true, message: null });
  });

  it("불러온 매물과 입력이 같으면 비활성 '저장됨' (AC-7)", () => {
    expect(
      getSaveButtonState({ listingsStatus: "ok", loanInput: INPUT, editingListing: SAVED }),
    ).toMatchObject({ label: "저장됨", isDisabled: true });
  });

  it("불러온 매물에서 값을 고치면 다시 활성 '저장'", () => {
    expect(
      getSaveButtonState({
        listingsStatus: "ok",
        loanInput: { ...INPUT, kbPrice: 118000 },
        editingListing: SAVED,
      }),
    ).toEqual({ label: "저장", isDisabled: false, message: null });
  });

  it("목록이 손상되면 입력과 무관하게 비활성이고 손상 안내를 붙인다 (AC-6d)", () => {
    for (const loanInput of [INPUT, null]) {
      expect(
        getSaveButtonState({ listingsStatus: "corrupt", loanInput, editingListing: null }),
      ).toEqual({
        label: "저장",
        isDisabled: true,
        message: "저장된 목록이 손상되어 저장할 수 없습니다(목록 화면에서 초기화)",
      });
    }
  });

  it("저장소 접근 불가면 비활성이고 안내를 붙인다 (AC-6e)", () => {
    expect(
      getSaveButtonState({ listingsStatus: "unavailable", loanInput: INPUT, editingListing: null }),
    ).toEqual({
      label: "저장",
      isDisabled: true,
      message: "이 브라우저에서는 저장할 수 없습니다",
    });
  });
});

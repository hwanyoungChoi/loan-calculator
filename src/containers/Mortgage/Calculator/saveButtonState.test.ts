import { describe, expect, it } from "vitest";

import { calculateLoan } from "@/lib/utils/calculateLoan";
import { listingToDraft } from "@/lib/utils/listingDraft";
import { toLoanInput } from "@/lib/utils/toLoanInput";
import { makeListing } from "@/test/listingFixture";

import { getSaveButtonState } from "./saveButtonState";

import type { Draft } from "@/lib/types/draft";
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

  it("불러온 매물에서 값을 고치면 다시 활성 '변경 저장'", () => {
    expect(
      getSaveButtonState({
        listingsStatus: "ok",
        loanInput: { ...INPUT, kbPrice: 118000 },
        editingListing: SAVED,
      }),
    ).toEqual({ label: "변경 저장", isDisabled: false, message: null });
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

describe("저장 버튼: 사용자 지정 LTV (AC-3e)", () => {
  // 계산 화면과 같은 경로: 매물 열기(listingToDraft) → draft 편집 → toLoanInput → getSaveButtonState
  const CUSTOM = makeListing({ ...INPUT, id: "custom", customLtvRate: 70 });

  function stateFor(draft: Draft, editingListing = CUSTOM) {
    return getSaveButtonState({
      listingsStatus: "ok",
      loanInput: toLoanInput(draft),
      editingListing,
    });
  }

  it("사용자 지정 매물을 열면 customLtv가 채워지고 '저장됨'", () => {
    const draft = listingToDraft(CUSTOM);
    expect(draft.customLtv).toBe("70");
    expect(stateFor(draft)).toMatchObject({ label: "저장됨", isDisabled: true });
  });

  it.each(["70%", " 70 ", "070"])(
    "같은 값을 %j로 고쳐 써도 정규화한 숫자가 같으면 '저장됨'",
    (customLtv) => {
      expect(stateFor({ ...listingToDraft(CUSTOM), customLtv })).toMatchObject({
        label: "저장됨",
        isDisabled: true,
      });
    },
  );

  it("LTV 값만 바꾸면 '변경 저장'이 다시 활성화된다", () => {
    expect(stateFor({ ...listingToDraft(CUSTOM), customLtv: "71" })).toEqual({
      label: "변경 저장",
      isDisabled: false,
      message: null,
    });
  });

  it("직접 입력을 끄면(규제로 되돌림) 다른 입력이라 '변경 저장'이 활성화된다", () => {
    expect(stateFor({ ...listingToDraft(CUSTOM), customLtv: null })).toMatchObject({
      label: "변경 저장",
      isDisabled: false,
    });
  });

  it("규제 매물을 열면 customLtv는 null이고 '저장됨', 직접 입력을 켜고 값을 넣으면 '변경 저장'", () => {
    const draft = listingToDraft(SAVED);
    expect(draft.customLtv).toBeNull();
    expect(stateFor(draft, SAVED)).toMatchObject({ label: "저장됨", isDisabled: true });
    expect(stateFor({ ...draft, customLtv: "40" }, SAVED)).toMatchObject({
      label: "변경 저장",
      isDisabled: false,
    });
  });

  it("직접 입력을 켠 채 비었거나 오류면 비활성 '저장'", () => {
    for (const customLtv of ["", "101", "70.5"]) {
      expect(stateFor({ ...listingToDraft(CUSTOM), customLtv })).toEqual({
        label: "저장",
        isDisabled: true,
        message: null,
      });
    }
  });

  it("ineligible 입력도 금액이 유효하면 저장 버튼이 활성이다", () => {
    const loanInput: LoanInput = {
      salePrice: 85000,
      kbPrice: 84000,
      region: "regulated",
      borrower: "noHomePreferred",
    };
    expect(calculateLoan(loanInput).status).toBe("ineligible");
    expect(getSaveButtonState({ listingsStatus: "ok", loanInput, editingListing: null })).toEqual({
      label: "저장",
      isDisabled: false,
      message: null,
    });
  });
});

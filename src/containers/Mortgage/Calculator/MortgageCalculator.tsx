import { useState } from "react";

import ChoiceGroup from "@/components/ChoiceGroup";
import { useDraft } from "@/hooks/useDraft";
import { useListings } from "@/hooks/useListings";
import { BORROWER_LABELS, BORROWERS, REGION_LABELS, REGIONS } from "@/lib/constants/loanConditions";
import { validateAmount } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { findDraftListing } from "@/lib/utils/listingDraft";
import { toLoanInput } from "@/lib/utils/toLoanInput";

import styles from "./MortgageCalculator.module.css";
import AmountInput from "./components/AmountInput";
import ResultCard from "./components/ResultCard";
import SaveSheet, { type SaveAction } from "./components/SaveSheet";
import SummaryBar from "./components/SummaryBar";
import { getSaveButtonState } from "./saveButtonState";

import type { DraftStore } from "@/lib/types/draft";
import type { ListingInput, ListingStore, ListingWriteResult } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";

type AmountField = "salePrice" | "kbPrice";

type MortgageCalculatorProps = {
  listingStore: ListingStore;
  draftStore: DraftStore;
  regulations: Regulations;
};

const REGION_OPTIONS = REGIONS.map((value) => ({ value, label: REGION_LABELS[value] }));
const BORROWER_OPTIONS = BORROWERS.map((value) => ({ value, label: BORROWER_LABELS[value] }));

const NO_ERRORS: Record<AmountField, string | null> = { salePrice: null, kbPrice: null };

function amountErrorOf(raw: string): string | null {
  const validation = validateAmount(raw);
  return validation.status === "error" ? validation.message : null;
}

/** 계산 화면은 항상 draft만 본다(ADR-004). */
function MortgageCalculator({ listingStore, draftStore, regulations }: MortgageCalculatorProps) {
  const draft = useDraft(draftStore);
  const listings = useListings(listingStore);
  const [amountErrors, setAmountErrors] = useState(NO_ERRORS);
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);

  // 오류는 blur에서 띄우고, 고쳐지면 입력 중에도 바로 걷는다.
  const handleAmountChange = (field: AmountField, raw: string) => {
    draftStore.update({ [field]: raw });
    if (amountErrorOf(raw) === null) setAmountErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountBlur = (field: AmountField) => {
    setAmountErrors((prev) => ({ ...prev, [field]: amountErrorOf(draft[field]) }));
  };

  /** 금액과 불러온 매물 연결만 비운다. 소재지·보유 상태는 마지막 선택을 유지한다. */
  const handleNewCalculation = () => {
    draftStore.update({ salePrice: "", kbPrice: "", listingId: null });
    setAmountErrors(NO_ERRORS);
  };

  const loanInput = toLoanInput(draft);
  const result = loanInput === null ? null : calculateLoan(loanInput, regulations);
  const editingListing = findDraftListing(listings, draft.listingId);
  const saveButton = getSaveButtonState({
    listingsStatus: listings.status,
    loanInput,
    editingListing,
  });

  /** 저장에 성공하면 시트를 닫고 계산 화면에 머문다. 새로 저장하면 draft가 새 매물을 가리킨다. */
  const saveListing = (action: SaveAction, input: ListingInput): ListingWriteResult => {
    if (action === "overwrite") {
      const updated: ListingWriteResult =
        editingListing === null
          ? { ok: false, reason: "notFound" }
          : listingStore.update(editingListing.id, input);
      if (updated.ok) setIsSaveSheetOpen(false);
      return updated;
    }
    const added = listingStore.add(input);
    if (!added.ok) return added;
    draftStore.update({ listingId: added.listing.id });
    setIsSaveSheetOpen(false);
    return { ok: true };
  };

  return (
    <div className={saveButton.message === null ? styles.page : styles.pageWithBarMessage}>
      <div className={styles.header}>
        <h1 className={styles.title}>주담대 한도·자기자금 계산기</h1>
        <button type="button" className={styles.newButton} onClick={handleNewCalculation}>
          새 계산
        </button>
      </div>
      <section className={styles.inputs} aria-label="입력">
        <AmountInput
          id="salePrice"
          label="매매가"
          value={draft.salePrice}
          error={amountErrors.salePrice}
          onChange={(raw) => handleAmountChange("salePrice", raw)}
          onBlur={() => handleAmountBlur("salePrice")}
        />
        <AmountInput
          id="kbPrice"
          label="KB시세"
          value={draft.kbPrice}
          error={amountErrors.kbPrice}
          onChange={(raw) => handleAmountChange("kbPrice", raw)}
          onBlur={() => handleAmountBlur("kbPrice")}
        />
        <ChoiceGroup
          name="region"
          legend="주택 소재지"
          options={REGION_OPTIONS}
          value={draft.region}
          columns={3}
          onChange={(region) => draftStore.update({ region })}
        />
        <ChoiceGroup
          name="borrower"
          legend="보유 상태"
          options={BORROWER_OPTIONS}
          value={draft.borrower}
          columns={2}
          onChange={(borrower) => draftStore.update({ borrower })}
        />
      </section>
      <ResultCard input={loanInput} regulations={regulations} />
      <SummaryBar result={result} save={saveButton} onSave={() => setIsSaveSheetOpen(true)} />
      {isSaveSheetOpen && loanInput !== null && (
        <SaveSheet
          initialName={editingListing?.name ?? ""}
          isEditing={editingListing !== null}
          onSave={(action, name) => saveListing(action, { ...loanInput, name })}
          onCancel={() => setIsSaveSheetOpen(false)}
        />
      )}
    </div>
  );
}

export default MortgageCalculator;

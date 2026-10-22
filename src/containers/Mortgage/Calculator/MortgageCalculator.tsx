import { useLayoutEffect, useRef, useState } from "react";

import { useDraft } from "@/hooks/useDraft";
import { useListings } from "@/hooks/useListings";
import { DEFAULT_CUSTOM_LTV } from "@/lib/constants/draft";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { findDraftListing } from "@/lib/utils/listingDraft";
import { toLoanInput } from "@/lib/utils/toLoanInput";

import styles from "./MortgageCalculator.module.css";
import { applyListingText } from "./applyListingText";
import EditingBanner from "./components/EditingBanner";
import EmptyResultCard from "./components/EmptyResultCard";
import LoanInputs, { KB_PRICE_INPUT_ID } from "./components/LoanInputs";
import ResultCard from "./components/ResultCard";
import SaveSheet, { type SaveAction } from "./components/SaveSheet";
import ScreenshotSheet from "./components/ScreenshotSheet";
import SummaryBar from "./components/SummaryBar";
import TradesSheet from "./components/TradesSheet";
import { describeEmptyResult } from "./emptyResultMessage";
import { useOpenSheet } from "./hooks/useOpenSheet";
import { toNewCalculationDraft } from "./newCalculationDraft";
import { pickSuggestedName } from "./pickSuggestedName";
import { getSaveButtonState, selectSaveStatus } from "./saveButtonState";
import { describeSummaryTag } from "./summaryTag";

import type { DraftStore } from "@/lib/types/draft";
import type { ListingInput, ListingStore, ListingWriteResult } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";
import type { TradeLookupStore } from "@/lib/types/tradeLookup";
import type { ParsedListingText } from "@/lib/utils/parseListingText";

type MortgageCalculatorProps = {
  listingStore: ListingStore;
  draftStore: DraftStore;
  tradeLookupStore: TradeLookupStore;
  regulations: Regulations;
};

/** 계산 화면은 항상 draft만 본다(ADR-004). */
function MortgageCalculator({
  listingStore,
  draftStore,
  tradeLookupStore,
  regulations,
}: MortgageCalculatorProps) {
  const draft = useDraft(draftStore);
  const listings = useListings(listingStore);
  // 바꾸면 입력부를 새로 그려 금액·LTV 칸의 오류 표시를 걷는다.
  const [inputsKey, setInputsKey] = useState(0);
  const sheet = useOpenSheet();
  // 실거래가 단지명 필터. 시트를 닫았다 열어도 같은 조회가 캐시에서 뜨게 여기 둔다. 매물 열기는 이 화면을 새로 그려 비운다.
  const [tradeAptName, setTradeAptName] = useState("");
  // 스크린샷에서 만든 저장 이름 제안. 새로고침하면 사라져도 되는 값이라 draft에 넣지 않는다.
  const [suggestedName, setSuggestedName] = useState("");
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const screenshotButtonRef = useRef<HTMLButtonElement>(null);
  const tradesButtonRef = useRef<HTMLButtonElement>(null);
  const renameButtonRef = useRef<HTMLButtonElement>(null);

  // 목록에서 카드나 탭으로 넘어오면 목록의 스크롤 위치가 남아 화면 중간에서 시작한다. 입력부터 보이게 맨 위로 올린다.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNewCalculation = () => {
    draftStore.update(toNewCalculationDraft(draft));
    setInputsKey((key) => key + 1);
    setTradeAptName("");
    setSuggestedName("");
  };

  /**
   * 스크린샷 적용은 새 매물 계산이다(ADR-017). LTV와 85㎡ 초과는 기본값으로 돌린다. 이전 매물의 단지명 필터가 남지 않게 읽은 단지명으로 바꾼다(못 읽었으면 비운다).
   * KB시세는 비워졌으니 바로 입력하도록 그 칸으로 포커스를 옮긴다.
   */
  const handleScreenshotApply = (parsed: ParsedListingText) => {
    draftStore.update(applyListingText(draft, parsed));
    setInputsKey((key) => key + 1);
    setSuggestedName(parsed.suggestedName);
    setTradeAptName(parsed.complexName ?? "");
    sheet.close();
    document.getElementById(KB_PRICE_INPUT_ID)?.focus();
  };

  const loanInput = toLoanInput(draft);
  const result = loanInput === null ? null : calculateLoan(loanInput, regulations);
  const summaryTag = describeSummaryTag(result);
  const editingListing = findDraftListing(listings, draft.listingId);
  const saveInput = { listingsStatus: listings.status, loanInput, editingListing };
  const saveButton = getSaveButtonState(saveInput);
  const hasInputChanges = selectSaveStatus(saveInput) !== "saved";

  /** 저장에 성공하면 시트를 닫고 계산 화면에 머문다. 새로 저장하면 draft가 새 매물을 가리킨다. */
  const saveListing = (action: SaveAction, input: ListingInput): ListingWriteResult => {
    if (action === "overwrite") {
      const updated: ListingWriteResult =
        editingListing === null
          ? { ok: false, reason: "notFound" }
          : listingStore.update(editingListing.id, input);
      if (updated.ok) {
        setSuggestedName("");
        sheet.close();
      }
      return updated;
    }
    const added = listingStore.add(input);
    if (!added.ok) return added;
    draftStore.update({ listingId: added.listing.id });
    setSuggestedName("");
    sheet.close();
    return { ok: true };
  };

  // 시트가 열린 동안 뒤 화면은 inert로 키보드·보조기기에서 빼낸다(aria-modal이 약속하는 동작).
  return (
    <>
      <div
        className={
          saveButton.message === null && summaryTag === null ? styles.page : styles.pageWithTallBar
        }
        inert={sheet.isOpen}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>주담대 한도·자기자금 계산기</h1>
          <button type="button" className={styles.newButton} onClick={handleNewCalculation}>
            새 계산
          </button>
        </div>
        {editingListing !== null && (
          <EditingBanner
            name={editingListing.name}
            isRenameDisabled={loanInput === null}
            renameButtonRef={renameButtonRef}
            onRename={() => sheet.open("save", renameButtonRef.current)}
          />
        )}
        <button
          ref={screenshotButtonRef}
          type="button"
          className={styles.secondaryAction}
          onClick={() => sheet.open("screenshot", screenshotButtonRef.current)}
        >
          스크린샷으로 채우기
        </button>
        <LoanInputs
          key={inputsKey}
          draft={draft}
          regulations={regulations}
          onChange={draftStore.update}
          onOpenTrades={(button) => sheet.open("trades", button)}
        />
        {loanInput === null ? (
          <EmptyResultCard message={describeEmptyResult(draft)} />
        ) : (
          <ResultCard input={loanInput} regulations={regulations} />
        )}
        <button
          ref={tradesButtonRef}
          type="button"
          className={styles.secondaryAction}
          onClick={() => sheet.open("trades", tradesButtonRef.current)}
        >
          이 지역 실거래가 보기
        </button>
        <SummaryBar
          result={result}
          tag={summaryTag}
          save={saveButton}
          saveButtonRef={saveButtonRef}
          onSave={() => sheet.open("save", saveButtonRef.current)}
        />
      </div>
      {sheet.openSheet === "save" && loanInput !== null && (
        <SaveSheet
          initialName={pickSuggestedName(
            editingListing?.name ?? "",
            draft.listingId,
            suggestedName,
          )}
          isEditing={editingListing !== null}
          hasInputChanges={hasInputChanges}
          onSave={(action, name) => saveListing(action, { ...loanInput, name })}
          onCancel={sheet.close}
        />
      )}
      {sheet.openSheet === "screenshot" && (
        <ScreenshotSheet
          currentSalePrice={draft.salePrice}
          isEditing={editingListing !== null}
          isLtvDefault={draft.customLtv === DEFAULT_CUSTOM_LTV}
          onApply={handleScreenshotApply}
          onClose={sheet.close}
        />
      )}
      {sheet.openSheet === "trades" && (
        <TradesSheet
          lookupStore={tradeLookupStore}
          aptName={tradeAptName}
          onAptNameSubmit={setTradeAptName}
          onClose={sheet.close}
        />
      )}
    </>
  );
}

export default MortgageCalculator;

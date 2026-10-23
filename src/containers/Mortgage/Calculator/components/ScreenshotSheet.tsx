import { useRef, type ChangeEvent } from "react";

import Sheet from "@/components/Sheet";
import {
  parseListingText,
  type ListingTextFailureReason,
  type ParsedListingText,
} from "@/lib/utils/parseListingText";

import ListingPreview from "./ListingPreview";
import RecognitionProgress from "./RecognitionProgress";
import styles from "./ScreenshotSheet.module.css";
import { useScreenshotOcr, type ScreenshotOcrState } from "../hooks/useScreenshotOcr";

type ScreenshotSheetProps = {
  /** 지금 매매가 칸의 입력(쉼표 없음). 값이 있으면 바뀌는 모습을 함께 보여 준다. */
  currentSalePrice: string;
  /** 불러온 매물을 편집 중인지. 적용하면 그 연결이 풀린다는 것을 알린다. */
  isEditing: boolean;
  /** LTV 직접 입력이 이미 기본값인지. 아니면 적용 때 기본값으로 돌아간다는 것을 알린다. */
  isLtvDefault: boolean;
  /** 지금 추가 비용 줄 수. 적용하면 비워지므로 0이 아니면 알린다(ADR-024 C3). */
  extraCostCount: number;
  onApply: (parsed: ParsedListingText) => void;
  onClose: () => void;
};

const FAILURE_MESSAGES: Record<ListingTextFailureReason, string> = {
  empty: "글자를 읽지 못했습니다",
  notSale: "매매 매물이 아닌 것 같습니다(전세·월세)",
  priceNotFound: "매매가를 찾지 못했습니다. 매물 상세 화면인지 확인하거나 금액을 직접 입력하세요",
};

const ERROR_MESSAGES: Record<Extract<ScreenshotOcrState, { status: "error" }>["reason"], string> = {
  notImage: "이미지 파일을 골라 주세요",
  engine: "인식 도구를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도하세요",
};

/**
 * 스크린샷을 기기 안에서 읽어 매매가를 채운다(ADR-020). 읽은 값은 미리보기로만 보여 주고 "적용"을 눌러야 계산 입력이 바뀐다.
 * 시트가 닫히면(언마운트) 훅이 인식을 멈추고 워커를 닫는다.
 */
function ScreenshotSheet({
  currentSalePrice,
  isEditing,
  isLtvDefault,
  extraCostCount,
  onApply,
  onClose,
}: ScreenshotSheetProps) {
  const { state, start, cancel } = useScreenshotOcr();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsed = state.status === "done" ? parseListingText(state.text) : null;
  // 아직 고른 이미지가 없거나 이미지가 아닌 파일을 골랐을 때. 결과가 있으면 "다른 스크린샷 고르기"가 보조 버튼이 된다.
  const isPickingFirst =
    state.status === "idle" || (state.status === "error" && state.reason === "notImage");

  const pickFile = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // iOS는 같은 파일을 다시 고르면 change가 오지 않는다. 고를 때마다 비운다.
    event.target.value = "";
    if (file !== undefined) start(file);
  };

  const pickButton = (label: string, className: string) => (
    <button type="button" className={className} onClick={pickFile}>
      {label}
    </button>
  );

  return (
    <Sheet title="스크린샷으로 채우기" onClose={onClose}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="스크린샷 파일"
        hidden
        disabled={state.status === "recognizing"}
        onChange={handleFileChange}
      />
      <div className={styles.result} aria-live="polite">
        {state.status === "idle" && (
          <ul className={styles.guide}>
            <li>네이버부동산 앱의 매물 상세 화면을 캡처해 올리세요</li>
            <li>이미지는 이 기기 안에서만 읽고 어디에도 보내지 않습니다</li>
          </ul>
        )}
        {state.status === "recognizing" && <RecognitionProgress progress={state.progress} />}
        {parsed?.ok === true && (
          <ListingPreview
            parsed={parsed}
            currentSalePrice={currentSalePrice}
            isEditing={isEditing}
            isLtvDefault={isLtvDefault}
            extraCostCount={extraCostCount}
          />
        )}
        {parsed?.ok === false && <p className={styles.error}>{FAILURE_MESSAGES[parsed.reason]}</p>}
        {state.status === "error" && <p className={styles.error}>{ERROR_MESSAGES[state.reason]}</p>}
      </div>
      {state.status === "done" && (
        <details className={styles.rawText}>
          <summary>인식한 글자 보기</summary>
          <pre className={styles.rawTextBody}>{state.text}</pre>
        </details>
      )}
      <div className={styles.actions}>
        {isPickingFirst && pickButton("스크린샷 고르기", styles.primaryButton)}
        {state.status === "recognizing" && (
          <button type="button" className={styles.secondaryButton} onClick={cancel}>
            취소
          </button>
        )}
        {state.status === "done" && (
          <>
            {pickButton("다른 스크린샷 고르기", styles.secondaryButton)}
            <button
              type="button"
              className={styles.primaryButton}
              disabled={parsed?.ok !== true}
              onClick={() => parsed?.ok === true && onApply(parsed)}
            >
              적용
            </button>
          </>
        )}
        {state.status === "error" && state.reason === "engine" && (
          <>
            {pickButton("다른 스크린샷 고르기", styles.secondaryButton)}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => start(state.file)}
            >
              다시 시도
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

export default ScreenshotSheet;

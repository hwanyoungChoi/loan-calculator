import { useId, useState, type FormEvent } from "react";

import {
  parseListingShareText,
  type ParsedShareText,
  type ShareTextFailureReason,
} from "@/lib/utils/parseListingShareText";

import styles from "./PasteSheet.module.css";
import SharePreview from "./SharePreview";
import Sheet from "./Sheet";

type PasteSheetProps = {
  /** 지금 매매가 칸의 입력(쉼표 없음). 값이 있으면 바뀌는 모습을 함께 보여 준다. */
  currentSalePrice: string;
  /** 불러온 매물을 편집 중인지. 적용하면 그 연결이 풀린다는 것을 알린다. */
  isEditing: boolean;
  /** LTV 직접 입력이 켜져 있는지. 적용하면 꺼진다는 것을 알린다. */
  isCustomLtvOn: boolean;
  onApply: (parsed: ParsedShareText) => void;
  onClose: () => void;
};

/** empty는 오류가 아니라 안내다. */
const FAILURE_MESSAGES: Record<ShareTextFailureReason, { text: string; isError: boolean }> = {
  empty: { text: "텍스트를 붙여 넣으세요", isError: false },
  linkOnly: { text: "링크는 읽지 않습니다. 앱의 공유 텍스트 전체를 붙여 넣으세요", isError: true },
  notSale: { text: "매매 매물이 아닌 것 같습니다(전세·월세)", isError: true },
  priceNotFound: { text: "매매가를 찾지 못했습니다. 금액을 직접 입력하세요", isError: true },
};

/**
 * 네이버부동산 공유 텍스트로 매매가를 채운다. 클립보드 API 없이 사용자가 직접 붙여 넣고,
 * 입력이 바뀌면 곧바로 미리보기를 갱신한다. 계산 입력은 "적용"을 눌러야 바뀐다.
 * 읽지 못해도 붙여 넣은 텍스트는 그대로 둔다.
 */
function PasteSheet({
  currentSalePrice,
  isEditing,
  isCustomLtvOn,
  onApply,
  onClose,
}: PasteSheetProps) {
  const fieldId = useId();
  const resultId = `${fieldId}-result`;
  const [text, setText] = useState("");

  const parsed = parseListingShareText(text);
  const isError = !parsed.ok && FAILURE_MESSAGES[parsed.reason].isError;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (parsed.ok) onApply(parsed);
  };

  return (
    <Sheet title="붙여넣기로 채우기" onClose={onClose}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId}>
            공유 텍스트
          </label>
          <textarea
            id={fieldId}
            className={styles.textarea}
            rows={6}
            autoFocus
            placeholder="네이버부동산 매물 → 공유 → 복사한 텍스트"
            value={text}
            aria-invalid={isError}
            aria-describedby={resultId}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <div id={resultId} className={styles.result} aria-live="polite">
          {parsed.ok ? (
            <SharePreview
              parsed={parsed}
              currentSalePrice={currentSalePrice}
              isEditing={isEditing}
              isCustomLtvOn={isCustomLtvOn}
            />
          ) : (
            <p className={isError ? styles.error : styles.prompt}>
              {FAILURE_MESSAGES[parsed.reason].text}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            취소
          </button>
          <button type="submit" className={styles.primaryButton} disabled={!parsed.ok}>
            적용
          </button>
        </div>
      </form>
    </Sheet>
  );
}

export default PasteSheet;

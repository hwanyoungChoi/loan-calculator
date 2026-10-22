import { useId, useRef, useState, type FormEvent } from "react";

import { LISTING_MEMO_MAX_LENGTH, validateListingMemo } from "@/lib/utils/validateListingMemo";
import { countChars } from "@/lib/utils/validateListingName";

import styles from "./MemoEditor.module.css";

import type { ListingWriteFailure, ListingWriteResult } from "@/lib/types/listing";

type MemoEditorProps = {
  listingName: string;
  initialMemo: string;
  onSave: (memo: string) => ListingWriteResult;
  onClose: () => void;
};

const WRITE_FAILURE_MESSAGES: Record<ListingWriteFailure["reason"], string> = {
  unavailable: "저장하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다",
  corrupt: "저장된 목록이 손상되어 저장할 수 없습니다",
  notFound: "이 매물이 목록에 없습니다(다른 탭에서 삭제됨)",
};

function memoErrorOf(raw: string): string | null {
  const validation = validateListingMemo(raw);
  return validation.ok ? null : validation.message;
}

/** 카드 안에서 펼치는 메모 편집. 비우고 저장하면 메모를 지운다. */
function MemoEditor({ listingName, initialMemo, onSave, onClose }: MemoEditorProps) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [memo, setMemo] = useState(initialMemo);
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const isUnchanged = memo.trim() === initialMemo;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;

  const handleChange = (raw: string) => {
    setMemo(raw);
    if (memoErrorOf(raw) === null) setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateListingMemo(memo);
    if (!validation.ok) {
      setError(validation.message);
      textareaRef.current?.focus();
      return;
    }
    const result = onSave(validation.memo);
    if (result.ok) onClose();
    else setWriteError(WRITE_FAILURE_MESSAGES[result.reason]);
  };

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {listingName} 메모
        </label>
        <span id={countId} className={styles.count}>
          {countChars(memo.trim())}/{LISTING_MEMO_MAX_LENGTH}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        className={styles.textarea}
        rows={3}
        autoFocus
        value={memo}
        aria-invalid={error !== null}
        aria-describedby={error === null ? countId : `${countId} ${errorId}`}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => setError(memoErrorOf(memo))}
      />
      {error !== null && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {writeError !== null && (
        <p role="alert" className={styles.error}>
          {writeError}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>
          취소
        </button>
        <button type="submit" className={styles.primaryButton} disabled={isUnchanged}>
          메모 저장
        </button>
      </div>
    </form>
  );
}

export default MemoEditor;

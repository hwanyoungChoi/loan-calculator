import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { formatThousands } from "@/lib/utils/amount";
import { LISTING_MEMO_MAX_LENGTH, validateListingMemo } from "@/lib/utils/validateListingMemo";
import { countChars } from "@/lib/utils/validateListingName";

import styles from "./MemoEditor.module.css";

import type { ListingSourceWriteFailure, ListingSourceWriteResult } from "@/lib/types/listing";

type MemoEditorProps = {
  listingName: string;
  /** 저장본의 메모. 입력칸의 처음 값으로만 쓴다: 창 포커스 재조회로 바뀌어도 입력 중인 문자열은 덮지 않는다. */
  initialMemo: string;
  onSave: (memo: string) => Promise<ListingSourceWriteResult>;
  onClose: () => void;
};

/** 상한(limit)은 메모 저장에서 생기지 않는다. */
const WRITE_FAILURE_MESSAGES: Record<ListingSourceWriteFailure["reason"], string> = {
  unavailable: "저장하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다",
  corrupt: "저장된 목록이 손상되어 저장할 수 없습니다",
  notFound: "이 매물이 목록에 없습니다(다른 탭에서 삭제됨)",
  notReady: "계정 상태를 확인한 뒤 다시 시도해 주세요",
  unauthorized: "로그인이 끝났습니다. 다시 로그인해 주세요",
  deletedElsewhere: "다른 기기에서 삭제된 매물입니다",
  limit: "저장하지 못했습니다. 다시 시도해 주세요",
  network: "저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요",
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
  const [isSaving, setIsSaving] = useState(false);
  const isUnchanged = memo.trim() === initialMemo;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;

  // 열릴 때 커서를 기존 메모 끝에 둔다. autoFocus는 커서를 맨 앞에 둬서 이어 쓰기 불편하다.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea === null) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  const handleChange = (raw: string) => {
    setMemo(raw);
    if (memoErrorOf(raw) === null) setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    const validation = validateListingMemo(memo);
    if (!validation.ok) {
      setError(validation.message);
      textareaRef.current?.focus();
      return;
    }
    setIsSaving(true);
    const result = await onSave(validation.memo);
    setIsSaving(false);
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
          {formatThousands(countChars(memo.trim()))}/{formatThousands(LISTING_MEMO_MAX_LENGTH)}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        className={styles.textarea}
        rows={6}
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
        <button type="submit" className={styles.primaryButton} disabled={isUnchanged || isSaving}>
          메모 저장
        </button>
      </div>
    </form>
  );
}

export default MemoEditor;

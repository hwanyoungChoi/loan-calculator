import { useRef, useState, type FormEvent } from "react";

import {
  countChars,
  LISTING_NAME_MAX_LENGTH,
  validateListingName,
} from "@/lib/utils/validateListingName";

import styles from "./SaveSheet.module.css";
import Sheet from "./Sheet";

import type { ListingWriteFailure, ListingWriteResult } from "@/lib/types/listing";

/** add: 새 매물로 저장, overwrite: 불러온 매물(draft.listingId)에 덮어쓰기 */
export type SaveAction = "add" | "overwrite";

type SaveSheetProps = {
  /** 불러온 매물을 고치는 중이면 그 이름, 아니면 빈 문자열 */
  initialName: string;
  isEditing: boolean;
  onSave: (action: SaveAction, name: string) => ListingWriteResult;
  onCancel: () => void;
};

const WRITE_FAILURE_MESSAGES: Record<ListingWriteFailure["reason"], string> = {
  unavailable: "저장하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다",
  corrupt: "저장된 목록이 손상되어 저장할 수 없습니다(목록 화면에서 초기화)",
  notFound: "덮어쓸 매물이 목록에 없습니다. 새로 저장하세요",
};

const NAME_INPUT_ID = "listing-name";
const NAME_COUNT_ID = "listing-name-count";
const NAME_ERROR_ID = "listing-name-error";

function nameErrorOf(raw: string): string | null {
  const validation = validateListingName(raw);
  return validation.ok ? null : validation.message;
}

/** 저장 시트. 취소·닫기 버튼과 Esc로 닫는다. */
function SaveSheet({ initialName, isEditing, onSave, onCancel }: SaveSheetProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  const primaryAction: SaveAction = isEditing ? "overwrite" : "add";

  const handleNameChange = (raw: string) => {
    setName(raw);
    if (nameErrorOf(raw) === null) setNameError(null);
  };

  const submit = (action: SaveAction) => {
    const validation = validateListingName(name);
    if (!validation.ok) {
      setNameError(validation.message);
      // 버튼을 눌러 제출하면 포커스가 버튼에 있다. 고칠 곳(첫 오류 필드)으로 옮긴다.
      nameInputRef.current?.focus();
      return;
    }
    const result = onSave(action, validation.name);
    setWriteError(result.ok ? null : WRITE_FAILURE_MESSAGES[result.reason]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(primaryAction);
  };

  const describedBy = nameError === null ? NAME_COUNT_ID : `${NAME_COUNT_ID} ${NAME_ERROR_ID}`;

  return (
    <Sheet title={isEditing ? "매물 저장(수정 중)" : "매물 저장"} onClose={onCancel}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={NAME_INPUT_ID}>
              매물 이름
            </label>
            <span id={NAME_COUNT_ID} className={styles.count}>
              {countChars(name.trim())}/{LISTING_NAME_MAX_LENGTH}
            </span>
          </div>
          <input
            ref={nameInputRef}
            id={NAME_INPUT_ID}
            className={styles.input}
            type="text"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="예: 래미안 101동"
            autoFocus
            value={name}
            aria-invalid={nameError !== null}
            aria-describedby={describedBy}
            onChange={(event) => handleNameChange(event.target.value)}
            onBlur={() => setNameError(nameErrorOf(name))}
          />
          {nameError !== null && (
            <p id={NAME_ERROR_ID} className={styles.error}>
              {nameError}
            </p>
          )}
        </div>
        {writeError !== null && (
          <p role="alert" className={styles.writeError}>
            {writeError}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            취소
          </button>
          {isEditing && (
            <button type="button" className={styles.secondaryButton} onClick={() => submit("add")}>
              새로 저장
            </button>
          )}
          <button type="submit" className={styles.primaryButton}>
            {isEditing ? "덮어쓰기" : "저장"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

export default SaveSheet;

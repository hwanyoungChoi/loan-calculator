import { useLayoutEffect, useRef, type ChangeEvent } from "react";

import { formatManwon, validateAmount } from "@/lib/utils/amount";

import styles from "./AmountInput.module.css";
import { caretAfterNonCommaChars, countNonCommaChars, toAmountInputText } from "./amountInputText";

type AmountInputProps = {
  id: string;
  label: string;
  /** 쉼표를 뺀 입력 문자열 */
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  /**
   * 목록의 줄처럼 칸이 여러 개 반복되는 자리. 라벨은 보조기기에만 남기고 힌트 줄을 빼 높이를 줄인다.
   * 쉼표와 "만원" 단위는 칸 안에 그대로 보인다.
   */
  isCompact?: boolean;
};

const HINT_PLACEHOLDER = "만원 단위로 입력";

function AmountInput({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
  isCompact = false,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretChars = useRef<number | null>(null);

  // 쉼표가 새로 그려지면 브라우저가 커서를 끝으로 보낸다. 입력하던 글자 뒤로 되돌린다.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const count = pendingCaretChars.current;
    if (input === null || count === null) return;
    pendingCaretChars.current = null;
    const caret = caretAfterNonCommaChars(input.value, count);
    input.setSelectionRange(caret, caret);
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: text, selectionStart } = event.target;
    pendingCaretChars.current = countNonCommaChars(text.slice(0, selectionStart ?? text.length));
    onChange(text.replaceAll(",", ""));
  };

  const validation = validateAmount(value);
  const hint = validation.status === "valid" ? formatManwon(validation.value) : HINT_PLACEHOLDER;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedIds = [...(isCompact ? [] : [hintId]), ...(error === null ? [] : [errorId])];

  return (
    <div className={styles.field}>
      <label className={isCompact ? styles.visuallyHidden : styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          value={toAmountInputText(value)}
          aria-invalid={error !== null}
          aria-describedby={describedIds.length === 0 ? undefined : describedIds.join(" ")}
          onChange={handleChange}
          onBlur={onBlur}
        />
        <span className={styles.unit} aria-hidden="true">
          만원
        </span>
      </div>
      {!isCompact && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error !== null && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export default AmountInput;

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { validateLtvRate } from "@/lib/utils/validateLtvRate";

import amountStyles from "./AmountInput.module.css";
import styles from "./CustomLtvField.module.css";

type CustomLtvFieldProps = {
  /** null이면 꺼짐, 문자열이면 입력 중인 값 */
  value: string | null;
  onChange: (value: string | null) => void;
};

const INPUT_ID = "customLtv";
const MESSAGE_ID = "customLtv-message";

/** 켠 채 비었을 때 바로 보인다. 결과 카드가 화면 밖일 수 있어 저장이 왜 안 되는지 여기서 알린다. */
const EMPTY_NOTICE = "값을 입력하거나 직접 입력을 끄세요";

function errorOf(raw: string): string | null {
  const validation = validateLtvRate(raw);
  return validation.status === "error" ? validation.message : null;
}

/** 은행 상담에서 받은 LTV를 직접 넣는 스위치와 % 입력 칸. 오류는 금액 칸과 같이 blur에서 띄운다. */
function CustomLtvField({ value, onChange }: CustomLtvFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (isOn: boolean) => {
    setError(null);
    if (!isOn) {
      onChange(null);
      return;
    }
    // 켜면 곧바로 입력할 수 있게 칸으로 포커스를 옮긴다. 칸이 그려진 뒤여야 한다.
    flushSync(() => onChange(""));
    inputRef.current?.focus();
  };

  const handleChange = (raw: string) => {
    onChange(raw);
    if (errorOf(raw) === null) setError(null);
  };

  const isEmpty = value !== null && validateLtvRate(value).status === "empty";
  const message = error ?? (isEmpty ? EMPTY_NOTICE : null);

  return (
    <div className={styles.field}>
      <label className={styles.switchRow}>
        <span>LTV 직접 입력(은행 상담값)</span>
        <input
          className={styles.switch}
          type="checkbox"
          role="switch"
          checked={value !== null}
          onChange={(event) => handleToggle(event.target.checked)}
        />
      </label>
      {value !== null && (
        <div className={amountStyles.field}>
          <label className={amountStyles.label} htmlFor={INPUT_ID}>
            사용자 지정 LTV
          </label>
          <div className={amountStyles.control}>
            <input
              ref={inputRef}
              id={INPUT_ID}
              className={amountStyles.input}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="0~100"
              value={value}
              aria-invalid={error !== null}
              aria-describedby={message === null ? undefined : MESSAGE_ID}
              onChange={(event) => handleChange(event.target.value)}
              onBlur={() => setError(errorOf(value))}
            />
            <span className={amountStyles.unit} aria-hidden="true">
              %
            </span>
          </div>
          {message !== null && (
            <p id={MESSAGE_ID} className={error === null ? styles.notice : amountStyles.error}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomLtvField;

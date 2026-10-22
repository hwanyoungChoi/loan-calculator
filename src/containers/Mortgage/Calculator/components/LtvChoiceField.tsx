import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import amountStyles from "@/components/AmountInput.module.css";
import ChoiceGroup from "@/components/ChoiceGroup";
import { DEFAULT_CUSTOM_LTV } from "@/lib/constants/draft";
import { validateLtvRate } from "@/lib/utils/validateLtvRate";

import { LTV_CHOICES, ltvChoiceOf, ltvChoicePatch, type LtvChoice } from "../ltvChoice";
import styles from "./LtvChoiceField.module.css";

import type { Draft } from "@/lib/types/draft";

type LtvChoiceFieldProps = {
  customLtv: string | null;
  isCustomLtvInput: boolean;
  /** [규제대로] 칩 이름. 예: "규제대로(40%)" */
  regulationLabel: string;
  onChange: (patch: Pick<Draft, "customLtv" | "isCustomLtvInput">) => void;
};

const INPUT_ID = "customLtv";
const MESSAGE_ID = "customLtv-message";

/** 직접 입력을 고른 채 비었을 때 바로 보인다. 결과 카드가 화면 밖일 수 있어 저장이 왜 안 되는지 여기서 알린다. */
const EMPTY_NOTICE = "값을 입력하거나 다른 LTV를 고르세요";

function errorOf(raw: string): string | null {
  const validation = validateLtvRate(raw);
  return validation.status === "error" ? validation.message : null;
}

/**
 * LTV 칩: 40%·70%(기본)·80%·직접 입력·규제대로. 직접 입력이면 % 칸이 나타난다. 오류는 금액 칸과 같이 blur에서 띄운다.
 * 규제 기준 LTV는 결과 카드에 나란히 보인다.
 */
function LtvChoiceField({
  customLtv,
  isCustomLtvInput,
  regulationLabel,
  onChange,
}: LtvChoiceFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const choice = ltvChoiceOf({ customLtv, isCustomLtvInput });
  const options = LTV_CHOICES.map((value) => ({ value, label: labelOf(value, regulationLabel) }));

  const handleChoiceChange = (next: LtvChoice) => {
    setError(null);
    if (next !== "custom") {
      onChange(ltvChoicePatch(next, ""));
      return;
    }
    // 이어받은 값을 전체 선택해 은행 상담값을 바로 덮어 칠 수 있게 한다. 칸이 그려진 뒤여야 한다.
    flushSync(() => onChange(ltvChoicePatch(next, customLtv ?? DEFAULT_CUSTOM_LTV)));
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleInputChange = (raw: string) => {
    onChange({ customLtv: raw, isCustomLtvInput: true });
    if (errorOf(raw) === null) setError(null);
  };

  const inputValue = customLtv ?? "";
  const isEmpty = validateLtvRate(inputValue).status === "empty";
  const message = error ?? (isEmpty ? EMPTY_NOTICE : null);

  return (
    <div className={styles.field}>
      <ChoiceGroup
        name="ltvChoice"
        legend="LTV"
        options={options}
        value={choice}
        columns={3}
        onChange={handleChoiceChange}
      />
      {choice === "custom" && (
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
              value={inputValue}
              aria-invalid={error !== null}
              aria-describedby={message === null ? undefined : MESSAGE_ID}
              onChange={(event) => handleInputChange(event.target.value)}
              onBlur={() => setError(errorOf(inputValue))}
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

function labelOf(choice: LtvChoice, regulationLabel: string): string {
  if (choice === "custom") return "직접 입력";
  if (choice === "regulation") return regulationLabel;
  return `${choice}%`;
}

export default LtvChoiceField;

export const LTV_RATE_ERROR_MESSAGES = {
  notNumber: "숫자만 입력하세요",
  notInteger: "정수(%)로 입력하세요",
  outOfRange: "0~100 사이로 입력하세요",
};

export type LtvRateValidation =
  { status: "empty" } | { status: "valid"; value: number } | { status: "error"; message: string };

const MAX_LTV_RATE = 100;

/** ASCII 숫자만. `\d`는 u 플래그가 없으면 전각·아라비아 숫자를 받지 않는다. */
const DIGITS_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+\.\d*$/;

/**
 * LTV 직접 입력(0~100 정수 %). 앞뒤 공백을 지운 뒤 끝의 `%` 하나만 허용하고,
 * `%`를 지운 뒤에는 다시 trim하지 않는다("70 %"는 오류). 소수 메시지가 범위 메시지보다 먼저다.
 */
export function validateLtvRate(raw: string): LtvRateValidation {
  const trimmed = raw.trim();
  if (trimmed === "") return { status: "empty" };
  const body = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
  if (DECIMAL_PATTERN.test(body)) {
    return { status: "error", message: LTV_RATE_ERROR_MESSAGES.notInteger };
  }
  if (!DIGITS_PATTERN.test(body)) {
    return { status: "error", message: LTV_RATE_ERROR_MESSAGES.notNumber };
  }
  const value = Number(body);
  if (value > MAX_LTV_RATE) {
    return { status: "error", message: LTV_RATE_ERROR_MESSAGES.outOfRange };
  }
  return { status: "valid", value };
}

import { describe, expect, it } from "vitest";

import { formatManwon, formatManwonOrDash, parseAmount, validateAmount } from "./amount";

// 메시지는 제품 상수가 아니라 스펙 "입력 검증 규칙" 표의 문구로 단언한다.
const NOT_POSITIVE = "0보다 큰 금액을 입력하세요";
const NOT_NUMBER = "숫자만 입력하세요";
const NOT_INTEGER = "정수(만원 단위)로 입력하세요";
const TOO_LARGE = "최대 9자리(999,999,999만원)까지 입력할 수 있습니다";

describe("parseAmount", () => {
  it.each(["", " ", "   ", "\t"])("빈 값·공백만(%j)은 empty", (raw) => {
    expect(parseAmount(raw)).toEqual({ kind: "empty" });
  });

  it.each([
    ["125000", 125000],
    ["125,000", 125000],
    ["  125000  ", 125000],
    ["0012", 12],
  ])("%j → value %i", (raw, value) => {
    expect(parseAmount(raw)).toEqual({ kind: "value", value });
  });

  it.each(["-5", "12a", "1 000", "12.5"])("%j는 invalid", (raw) => {
    expect(parseAmount(raw)).toEqual({ kind: "invalid" });
  });
});

describe("validateAmount (AC-8a, 입력 검증 규칙 표)", () => {
  it.each(["", " ", "   ", "\t"])("빈 값·공백만(%j)은 오류가 아닌 empty", (raw) => {
    expect(validateAmount(raw)).toEqual({ status: "empty" });
  });

  it.each([
    ["125000", 125000],
    ["125,000", 125000],
    ["1,250,00", 125000],
    [" 125000 ", 125000],
    ["0012", 12],
    ["1", 1],
    ["999999999", 999999999],
    ["999,999,999", 999999999],
    ["0999999999", 999999999],
  ])("%j → valid %i", (raw, value) => {
    expect(validateAmount(raw)).toEqual({ status: "valid", value });
  });

  it.each(["0", "000", "0,000"])("%j → 0보다 큰 금액 오류", (raw) => {
    expect(validateAmount(raw)).toEqual({ status: "error", message: NOT_POSITIVE });
  });

  it.each(["-5", "12a", "1 000", "abc", "1e5", "+5"])("%j → 숫자만 오류", (raw) => {
    expect(validateAmount(raw)).toEqual({ status: "error", message: NOT_NUMBER });
  });

  it.each(["12.5", "0.5"])("%j → 정수 오류", (raw) => {
    expect(validateAmount(raw)).toEqual({ status: "error", message: NOT_INTEGER });
  });

  it.each(["1000000000", "1,000,000,000", "9999999999", "99999999999999999999"])(
    "%j(앞의 0을 뗀 10자리 이상) → 최대 9자리 오류",
    (raw) => {
      expect(validateAmount(raw)).toEqual({ status: "error", message: TOO_LARGE });
    },
  );
});

describe("formatManwon (AC-8a, 경계표)", () => {
  it.each([
    [0, "0만원"],
    [1, "1만원"],
    [9999, "9,999만원"],
    [10000, "1억원"],
    [10001, "1억 1만원"],
    [100000, "10억원"],
    [125000, "12억 5,000만원"],
    [999999999, "99,999억 9,999만원"],
  ])("%i → %s", (n, expected) => {
    expect(formatManwon(n)).toBe(expected);
  });
});

describe("formatManwonOrDash", () => {
  it("null은 0으로 채우지 않고 —로 보여준다", () => {
    expect(formatManwonOrDash(null)).toBe("—");
  });

  it("0은 0만원이다(미확인과 구분)", () => {
    expect(formatManwonOrDash(0)).toBe("0만원");
  });
});

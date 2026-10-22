import { describe, expect, it } from "vitest";

import { validateLtvRate } from "./validateLtvRate";

// 메시지는 제품 상수가 아니라 스펙 AC-2(a) 표의 문구를 그대로 적는다. 문구가 바뀌면 스펙과 함께 고친다.
const NOT_NUMBER = "숫자만 입력하세요";
const NOT_INTEGER = "정수(%)로 입력하세요";
const OUT_OF_RANGE = "0~100 사이로 입력하세요";

describe("validateLtvRate 규칙표 (AC-2a)", () => {
  it.each(["", "   ", "\t", " \n "])("%j → empty", (raw) => {
    expect(validateLtvRate(raw)).toEqual({ status: "empty" });
  });

  it.each<[string, number]>([
    ["0", 0],
    ["100", 100],
    ["70", 70],
    ["70%", 70],
    [" 70% ", 70],
    [" 0 ", 0],
    ["0%", 0],
    ["100%", 100],
    ["1", 1],
    ["99", 99],
    // 금액 칸처럼 앞 0을 받는다
    ["070", 70],
    ["00", 0],
    ["0100", 100],
  ])("%j → valid %i", (raw, value) => {
    expect(validateLtvRate(raw)).toEqual({ status: "valid", value });
  });

  // 소수 메시지가 범위 메시지보다 먼저다("100.5"도 정수 오류).
  it.each(["70.5", "70.0", "70.", "100.5", "70.5%", "0.5"])(`%j → ${NOT_INTEGER}`, (raw) => {
    expect(validateLtvRate(raw)).toEqual({ status: "error", message: NOT_INTEGER });
  });

  it.each(["101", "1000", "99999999999999999999", "101%", "0101"])(
    `%j → ${OUT_OF_RANGE}`,
    (raw) => {
      expect(validateLtvRate(raw)).toEqual({ status: "error", message: OUT_OF_RANGE });
    },
  );

  it.each([
    // % 위치·개수: 끝의 % 하나만. %를 지운 뒤에는 다시 trim하지 않는다.
    "%",
    " % ",
    "70 %",
    "%70",
    "70%%",
    // 부호
    "-5",
    "-0",
    "+70",
    // 숫자가 아닌 문자, 지수·16진수·쉼표·중간 공백
    "7a",
    "abc",
    "1e2",
    "0x10",
    "1,0",
    "7 0",
    // ASCII 숫자만(전각·아라비아 숫자 거부)
    "７０",
    "٧٠",
  ])(`%j → ${NOT_NUMBER}`, (raw) => {
    expect(validateLtvRate(raw)).toEqual({ status: "error", message: NOT_NUMBER });
  });
});

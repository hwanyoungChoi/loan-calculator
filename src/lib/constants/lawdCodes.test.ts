import { describe, expect, it } from "vitest";

import { LAWD_CODES } from "./lawdCodes";

describe("LAWD_CODES (AC-5d)", () => {
  it("코드는 모두 5자리 숫자이고 중복이 없다", () => {
    const codes = LAWD_CODES.map((entry) => entry.code);
    expect(codes.filter((code) => !/^\d{5}$/.test(code))).toEqual([]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("시도·시군구 이름이 비어 있지 않고, 한 시도 안에 같은 시군구 이름이 없다", () => {
    expect(
      LAWD_CODES.filter((entry) => entry.sido.trim() === "" || entry.sigungu.trim() === ""),
    ).toEqual([]);
    const names = LAWD_CODES.map((entry) => `${entry.sido}/${entry.sigungu}`);
    expect(new Set(names).size).toBe(names.length);
  });

  it("200개 이상이고 종로구 11110을 포함하며, 개편 전 강원(42xxx)·전북(45xxx) 코드가 없다", () => {
    expect(LAWD_CODES.length).toBeGreaterThanOrEqual(200);
    expect(LAWD_CODES).toContainEqual({ code: "11110", sido: "서울특별시", sigungu: "종로구" });
    expect(LAWD_CODES.filter((entry) => /^4[25]/.test(entry.code))).toEqual([]);
  });
});

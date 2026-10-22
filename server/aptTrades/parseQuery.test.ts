import { describe, expect, it } from "vitest";

import { parseQuery } from "./parseQuery";

const parse = (query: string) => parseQuery(new URLSearchParams(query));

describe("parseQuery", () => {
  it("기본값: months 3, aptName 빈 문자열(필터 없음)", () => {
    expect(parse("lawdCd=11680")).toEqual({ ok: true, lawdCd: "11680", months: 3, aptName: "" });
    expect(parse("lawdCd=11110&months=6&aptName=%20%20")).toEqual({
      ok: true,
      lawdCd: "11110",
      months: 6,
      aptName: "",
    });
  });

  it.each([
    ["", "lawdCd"],
    ["lawdCd=", "lawdCd"],
    ["lawdCd=1111", "lawdCd"],
    ["lawdCd=11110a", "lawdCd"],
    ["lawdCd=%2011110", "lawdCd"],
    ["lawdCd=99999", "lawdCd"],
    ["lawdCd=11110&lawdCd=11680", "lawdCd"],
    ["lawdCd=11110&months=", "months"],
    ["lawdCd=11110&months=0", "months"],
    ["lawdCd=11110&months=7", "months"],
    ["lawdCd=11110&months=2.5", "months"],
    ["lawdCd=11110&months=03", "months"],
    ["lawdCd=11110&months=%2B3", "months"],
  ])("%j → 400, message에 %s 이름만", (query, name) => {
    const result = parse(query);
    expect(result).toEqual({ ok: false, message: expect.stringContaining(name) });
  });

  it("aptName은 trim 뒤 코드포인트 40자까지", () => {
    const params = (aptName: string) => new URLSearchParams({ lawdCd: "11110", aptName });
    expect(parseQuery(params(`  ${"가".repeat(40)}  `)).ok).toBe(true);
    expect(parseQuery(params("가".repeat(41))).ok).toBe(false);
    expect(parseQuery(params("😀".repeat(40))).ok).toBe(true);
    expect(parseQuery(params("😀".repeat(41))).ok).toBe(false);
  });

  it("입력값을 message로 되돌려 주지 않는다", () => {
    const result = parse("lawdCd=%3Cscript%3E");
    expect(result.ok === false && result.message).not.toContain("<script>");
  });
});

import { describe, expect, it } from "vitest";

import { describeCondition, formatCustomLtv } from "./describeCondition";

describe("describeCondition (조건 요약)", () => {
  it("규제 LTV면 소재지 · 보유 상태", () => {
    expect(describeCondition("regulated", "noHomePreferred", undefined)).toBe(
      "규제지역 · 무주택·서민실수요자",
    );
  });

  it("사용자 지정이면 끝에 ' · 사용자 지정 LTV n%'를 붙인다", () => {
    expect(describeCondition("regulated", "noHome", 70)).toBe(
      "규제지역 · 무주택 · 사용자 지정 LTV 70%",
    );
  });

  it("0%도 사용자 지정이다(falsy로 빼지 않는다)", () => {
    expect(describeCondition("nonCapital", "firstHome", 0)).toBe(
      "비수도권 · 무주택·생애최초 · 사용자 지정 LTV 0%",
    );
  });

  it("formatCustomLtv", () => {
    expect(formatCustomLtv(70)).toBe("사용자 지정 LTV 70%");
  });
});

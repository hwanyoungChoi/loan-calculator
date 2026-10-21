import { describe, expect, it } from "vitest";

import { countChars, LISTING_NAME_MAX_LENGTH, validateListingName } from "./validateListingName";

describe("validateListingName (AC-6b)", () => {
  it("최대 길이는 40자다", () => {
    expect(LISTING_NAME_MAX_LENGTH).toBe(40);
  });

  const validCases: [string, string, string][] = [
    ["보통 이름", "래미안 101동", "래미안 101동"],
    ["1자", "a", "a"],
    ["앞뒤 공백은 trim", "  래미안 101동 \t", "래미안 101동"],
    ["가운데 공백은 유지", "자이  3단지", "자이  3단지"],
    ["40자", "가".repeat(40), "가".repeat(40)],
    ["trim 후 40자(공백 포함 44자)", `  ${"가".repeat(40)}  `, "가".repeat(40)],
    ["이모지 40개(UTF-16 80단위지만 코드포인트 40)", "😀".repeat(40), "😀".repeat(40)],
    ["한글·이모지 섞어 40자", `${"가".repeat(39)}🏠`, `${"가".repeat(39)}🏠`],
  ];

  it.each(validCases)("%s → ok", (_, raw, name) => {
    expect(validateListingName(raw)).toEqual({ ok: true, name });
  });

  const invalidCases: [string, string][] = [
    ["빈 값", ""],
    ["공백만", "   "],
    ["탭·줄바꿈만", "\t\n "],
    ["전각 공백만", "　"],
    ["41자", "가".repeat(41)],
    ["trim 후 41자", ` ${"가".repeat(41)} `],
    ["이모지 41개", "😀".repeat(41)],
    ["한글 40자 + 이모지 1개", `${"가".repeat(40)}🏠`],
  ];

  it.each(invalidCases)("%s → 오류 메시지", (_, raw) => {
    const result = validateListingName(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.trim()).not.toBe("");
  });

  it("빈 값과 길이 초과는 서로 다른 메시지다", () => {
    const empty = validateListingName(" ");
    const tooLong = validateListingName("가".repeat(41));
    if (empty.ok || tooLong.ok) throw new Error("둘 다 오류여야 한다");
    expect(empty.message).not.toBe(tooLong.message);
  });
});

describe("countChars", () => {
  it("코드포인트 기준으로 센다(서로게이트 쌍 이모지 1개 = 1자)", () => {
    expect(countChars("")).toBe(0);
    expect(countChars("래미안")).toBe(3);
    expect(countChars("😀")).toBe(1);
    expect("😀".length).toBe(2);
    expect(countChars("😀a가")).toBe(3);
  });
});

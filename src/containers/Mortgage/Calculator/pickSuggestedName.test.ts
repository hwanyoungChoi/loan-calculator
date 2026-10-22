import { describe, expect, it } from "vitest";

import { pickSuggestedName } from "./pickSuggestedName";

describe("pickSuggestedName (AC-7d)", () => {
  it("편집 중인 매물이 없으면 제안 이름", () => {
    expect(pickSuggestedName("", null, "래미안OO 84㎡")).toBe("래미안OO 84㎡");
  });

  it("불러온 매물을 편집 중이면 기존 이름", () => {
    expect(pickSuggestedName("우리집", "listing-a", "래미안OO 84㎡")).toBe("우리집");
  });
});

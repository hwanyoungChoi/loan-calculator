import { describe, expect, it } from "vitest";

import { recentMonths } from "./recentMonths";

describe("recentMonths", () => {
  it.each([
    ["2026-01-31T14:59:59.999Z", 3, ["202601", "202512", "202511"]],
    ["2026-01-31T15:00:00.000Z", 3, ["202602", "202601", "202512"]],
    ["2025-12-31T15:00:00Z", 1, ["202601"]],
    ["2025-12-31T15:00:00Z", 6, ["202601", "202512", "202511", "202510", "202509", "202508"]],
  ])("%s, %i달 → KST 기준 최신 먼저", (iso, count, expected) => {
    expect(recentMonths(new Date(iso), count)).toEqual(expected);
  });
});

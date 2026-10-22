import { describe, expect, it } from "vitest";

import { formatTradeRow } from "./formatTradeRow";

import type { AptTrade } from "@/lib/types/aptTrade";

const TRADE: AptTrade = {
  aptName: "래미안대치팰리스",
  umdName: "대치동",
  exclusiveArea: 84.97,
  floor: 12,
  dealAmount: 315000,
  dealDate: "2026-10-03",
};

describe("formatTradeRow", () => {
  it("윗줄은 단지명과 금액, 아랫줄은 계약일 · 전용면적 · 층 · 법정동이다", () => {
    expect(formatTradeRow(TRADE)).toEqual({
      title: "래미안대치팰리스",
      amount: "31억 5,000만원",
      detail: "2026-10-03 · 84.97㎡ · 12층 · 대치동",
    });
  });

  it("정수 면적은 소수점 없이 쓰고, 층·법정동이 없으면 그 칸을 뺀다", () => {
    expect(formatTradeRow({ ...TRADE, exclusiveArea: 59, floor: null, umdName: null }).detail).toBe(
      "2026-10-03 · 59㎡",
    );
  });
});

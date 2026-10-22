import { formatManwon } from "@/lib/utils/amount";

import type { AptTrade } from "@/lib/types/aptTrade";

export type TradeRowView = { title: string; amount: string; detail: string };

/** 윗줄 단지명 · 금액, 아랫줄 계약일 · 전용면적 · 층 · 법정동(없는 값은 뺀다) */
export function formatTradeRow(trade: AptTrade): TradeRowView {
  const details = [
    trade.dealDate,
    `${trade.exclusiveArea}㎡`,
    trade.floor === null ? null : `${trade.floor}층`,
    trade.umdName,
  ];
  return {
    title: trade.aptName,
    amount: formatManwon(trade.dealAmount),
    detail: details.filter((part) => part !== null).join(" · "),
  };
}

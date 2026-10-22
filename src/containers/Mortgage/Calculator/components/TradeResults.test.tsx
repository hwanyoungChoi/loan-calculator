// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";

import TradeResults from "./TradeResults";

import type { AptTrade, AptTradesResponse } from "@/lib/types/aptTrade";

function trade(index: number): AptTrade {
  return {
    aptName: `단지${index}`,
    umdName: "대치동",
    exclusiveArea: 84,
    floor: 3,
    dealAmount: 100000,
    dealDate: "2026-10-01",
  };
}

function response(count: number): AptTradesResponse {
  return {
    lawdCd: "11680",
    months: ["202610", "202609", "202608"],
    items: Array.from({ length: count }, (_, index) => trade(index)),
    source: { name: "국토교통부 아파트 매매 실거래가", url: "https://www.data.go.kr/" },
  };
}

function renderSuccess(count: number) {
  render(<TradeResults status="success" data={response(count)} error={null} onRetry={() => {}} />);
}

function renderError(error: unknown, onRetry = () => {}) {
  render(<TradeResults status="error" data={undefined} error={error} onRetry={onRetry} />);
}

describe("TradeResults (AC-5c)", () => {
  it("빈 결과는 빈 상태 문구를 보인다", () => {
    renderSuccess(0);
    expect(
      screen.getByText("이 조건의 거래가 없습니다. 단지명을 지우거나 다른 시군구를 고르세요"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it.each([
    ["quotaExceeded", "오늘 조회 한도를 넘었습니다. 내일 다시 시도하세요", false],
    ["rateLimited", "잠시 뒤 다시 시도하세요", true],
  ] as const)("429 %s는 그 문구를 보인다", (code, message, canRetry) => {
    renderError(new ApiRequestError(429, { error: code, message: "22" }));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByRole("button", { name: "다시 시도" }) !== null).toBe(canRetry);
  });

  it("500 internal은 다시 시도 버튼이 있고 누르면 재조회한다", async () => {
    const onRetry = vi.fn();
    renderError(new ApiRequestError(500, { error: "internal", message: "" }), onRetry);
    expect(screen.getByRole("alert")).toHaveTextContent("실거래가를 불러오지 못했습니다");
    await userEvent.setup().click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each([
    [50, false],
    [51, true],
  ])("%i건이면 더 보기 버튼 %s", (count, hasMore) => {
    renderSuccess(count);
    expect(screen.getAllByRole("listitem")).toHaveLength(50);
    expect(screen.queryByRole("button", { name: "더 보기" }) !== null).toBe(hasMore);
  });

  it.each([
    [100, false],
    [101, true],
  ])("%i건이면 더 보기 한 번 뒤 100건이 보이고 다음 더 보기는 %s", async (count, hasMore) => {
    const user = userEvent.setup();
    renderSuccess(count);
    await user.click(screen.getByRole("button", { name: "더 보기" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    expect(screen.queryByRole("button", { name: "더 보기" }) !== null).toBe(hasMore);
  });
});

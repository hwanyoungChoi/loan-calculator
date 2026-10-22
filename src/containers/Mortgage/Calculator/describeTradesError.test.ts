import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api/client";

import { canRetryTradesError, describeTradesError } from "./describeTradesError";

describe("describeTradesError", () => {
  it.each([
    ["notConfigured", "서버 설정이 끝나지 않았습니다(서비스키 미등록)", false],
    ["quotaExceeded", "오늘 조회 한도를 넘었습니다. 내일 다시 시도하세요", false],
    ["rateLimited", "잠시 뒤 다시 시도하세요", true],
    ["internal", "실거래가를 불러오지 못했습니다", true],
  ] as const)("%s → %s", (code, message, canRetry) => {
    const error = new ApiRequestError(500, { error: code, message: "" });
    expect(describeTradesError(error)).toBe(message);
    expect(canRetryTradesError(error)).toBe(canRetry);
  });

  it("본문이 ApiError가 아닌 응답과 네트워크 실패도 다시 시도할 수 있는 문구다", () => {
    expect(describeTradesError(new ApiRequestError(502, null))).toBe(
      "실거래가를 불러오지 못했습니다",
    );
    expect(describeTradesError(new TypeError("Failed to fetch"))).toBe(
      "실거래가를 불러오지 못했습니다. 인터넷 연결을 확인하세요",
    );
    expect(canRetryTradesError(new TypeError("Failed to fetch"))).toBe(true);
  });
});

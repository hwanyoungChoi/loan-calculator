// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createOcrSession, type OcrProgress } from "@/lib/utils/ocrSession";

import { useScreenshotOcr } from "./useScreenshotOcr";

vi.mock("@/lib/utils/ocrSession", () => ({ createOcrSession: vi.fn() }));

describe("useScreenshotOcr (AC-3)", () => {
  it("인식 중에는 진행을 보이고 다시 시작을 무시하며, 취소하면 워커를 닫고 늦게 끝난 결과를 버린다. 언마운트도 워커를 닫는다", async () => {
    let finish: (text: string) => void = () => {};
    let report: (progress: OcrProgress) => void = () => {};
    const recognize = vi.fn((_image: Blob, onProgress: (progress: OcrProgress) => void) => {
      report = onProgress;
      return new Promise<string>((resolve) => {
        finish = resolve;
      });
    });
    const terminate = vi.fn(async () => {});
    vi.mocked(createOcrSession).mockReturnValue({ recognize, terminate });
    const file = new File(["png"], "a.png", { type: "image/png" });

    const { result, unmount } = renderHook(() => useScreenshotOcr());
    act(() => result.current.start(file));
    expect(result.current.state).toEqual({
      status: "recognizing",
      progress: { phase: "preparing" },
    });
    expect(recognize).toHaveBeenCalledWith(file, expect.any(Function));

    act(() => report({ phase: "recognizing", ratio: 0.4 }));
    expect(result.current.state).toEqual({
      status: "recognizing",
      progress: { phase: "recognizing", ratio: 0.4 },
    });
    // 인식 중 다시 고르면 작업을 겹치지 않는다.
    act(() => result.current.start(file));
    expect(recognize).toHaveBeenCalledTimes(1);

    act(() => result.current.cancel());
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ status: "idle" });

    // 취소된 작업이 나중에 끝나도 결과가 나타나지 않는다.
    await act(async () => finish("매매 12억"));
    expect(result.current.state).toEqual({ status: "idle" });

    unmount();
    expect(terminate).toHaveBeenCalledTimes(2);
  });
});

// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as ScrollRestorationModule from "./useListingsScrollRestoration";

let scrollModule: typeof ScrollRestorationModule;
let scrollTo: ReturnType<typeof vi.spyOn>;

/** jsdom의 scrollY는 늘 0이다. 브라우저처럼 scrollTo가 scrollY를 바꾸게 한다. */
function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
}

function mountListings() {
  return renderHook(() => scrollModule.useListingsScrollRestoration());
}

describe("useListingsScrollRestoration (AC-8e 목록 스크롤 복원)", () => {
  // 저장 위치는 모듈 변수라 테스트마다 모듈을 새로 읽어 "새로고침"한 상태에서 시작한다.
  beforeEach(async () => {
    vi.resetModules();
    scrollModule = await import("./useListingsScrollRestoration");
    setScrollY(0);
    scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(((x: number, y: number) => {
      void x;
      setScrollY(y);
    }) as typeof window.scrollTo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setScrollY(0);
  });

  it("처음(새로고침 직후) 마운트하면 맨 위(0)에서 시작한다", () => {
    mountListings();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("언마운트할 때의 scrollY를 저장하고, 다시 마운트하면 그 위치로 복원한다", () => {
    const first = mountListings();
    setScrollY(1234);
    first.unmount();

    // 계산 화면이 맨 위로 올린 상태에서 뒤로 가기로 돌아온다.
    setScrollY(0);
    mountListings();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 1234);
    expect(window.scrollY).toBe(1234);
  });

  it("마운트 시점이 아니라 언마운트 시점의 위치를 저장하고, 매번 덮어쓴다", () => {
    const first = mountListings();
    setScrollY(300);
    first.unmount();

    const second = mountListings();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 300);
    setScrollY(50);
    second.unmount();

    mountListings();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 50);
  });

  it("맨 위에서 떠나면 0을 저장한다(이전 값이 남지 않는다)", () => {
    const first = mountListings();
    setScrollY(800);
    first.unmount();
    const second = mountListings();
    setScrollY(0);
    second.unmount();

    mountListings();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("resetListingsScroll(탭 진입) 뒤에 마운트하면 저장 위치를 버리고 0에서 시작한다", () => {
    const first = mountListings();
    setScrollY(900);
    first.unmount();

    scrollModule.resetListingsScroll();
    mountListings();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("마운트된 동안에는 다시 스크롤하지 않는다(리렌더에 복원이 반복되지 않음)", () => {
    const view = mountListings();
    setScrollY(400);
    view.rerender();
    view.rerender();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollY).toBe(400);
  });
});

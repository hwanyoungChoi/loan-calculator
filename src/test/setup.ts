import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals를 켜지 않았으므로 testing-library의 자동 cleanup이 등록되지 않는다.
afterEach(() => {
  cleanup();
});

// jsdom은 scrollTo를 구현하지 않아 부를 때마다 "Not implemented" 오류를 찍는다. 스크롤 확인은 vi.spyOn으로 한다.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}

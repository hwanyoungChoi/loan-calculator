import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals를 켜지 않았으므로 testing-library의 자동 cleanup이 등록되지 않는다.
afterEach(() => {
  cleanup();
});

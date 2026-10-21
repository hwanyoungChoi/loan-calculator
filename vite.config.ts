import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // 기본 환경은 node. 화면 테스트 파일만 첫 줄에 `// @vitest-environment jsdom`을 적는다(ADR-008).
    setupFiles: ["./src/test/setup.ts"],
  },
});

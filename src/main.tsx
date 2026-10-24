import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getBrowserStorage } from "@/lib/utils/browserStorage";
import { applyTextSize, loadTextSize } from "@/lib/utils/textSizeStorage";

import "./index.css";
import App from "./App.tsx";

// 저장된 글자 크기를 첫 렌더 전에 적용해 기본 크기로 그렸다가 바뀌는 깜박임을 없앤다.
applyTextSize(loadTextSize(getBrowserStorage()));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

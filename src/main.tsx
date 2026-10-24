import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getBrowserStorage } from "@/lib/utils/browserStorage";
import { applyTextSize, loadTextSize } from "@/lib/utils/textSizeStorage";

// 앱이 쓰는 굵기만(400·600·700, 500은 쓰지 않음). 한글은 unicode-range로 나뉘어 화면에 나온 글자의 조각만 받는다.
import "@fontsource/ibm-plex-sans-kr/400.css";
import "@fontsource/ibm-plex-sans-kr/600.css";
import "@fontsource/ibm-plex-sans-kr/700.css";
import "./index.css";
import App from "./App.tsx";

// 저장된 글자 크기를 첫 렌더 전에 적용해 기본 크기로 그렸다가 바뀌는 깜박임을 없앤다.
applyTextSize(loadTextSize(getBrowserStorage()));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

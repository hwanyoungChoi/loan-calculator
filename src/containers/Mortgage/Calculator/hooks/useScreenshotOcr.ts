import { useEffect, useRef, useState } from "react";

import { createOcrSession, type OcrProgress, type OcrSession } from "@/lib/utils/ocrSession";

/** engine: 엔진·자산 로드 또는 이미지 해독 실패. 같은 파일로 다시 시도할 수 있게 파일을 함께 둔다. */
export type ScreenshotOcrState =
  | { status: "idle" }
  | { status: "recognizing"; progress: OcrProgress }
  | { status: "done"; text: string }
  | { status: "error"; reason: "notImage" }
  | { status: "error"; reason: "engine"; file: File };

const IDLE: ScreenshotOcrState = { status: "idle" };

/**
 * 스크린샷 한 장을 기기 안에서 읽는다. 네트워크 API가 아니라 기기 안의 계산이라 react-query를 쓰지 않는다.
 * 워커는 이 훅이 처음 인식할 때 만들고, 취소하거나 훅이 사라질 때(시트를 닫을 때) 닫는다(가정 A3).
 * 이미지는 해독하지 않고 File 그대로 엔진에 넘긴다.
 */
export function useScreenshotOcr() {
  const [state, setState] = useState<ScreenshotOcrState>(IDLE);
  const sessionRef = useRef<OcrSession | null>(null);
  // 취소·언마운트로 버린 인식의 늦은 결과를 거르는 번호. 시작·취소마다 바뀐다.
  const runIdRef = useRef(0);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      void sessionRef.current?.terminate();
    },
    [],
  );

  /** 인식 중에는 무시한다. 같은 워커에 작업이 겹치지 않게 한다. */
  const start = (file: File) => {
    if (state.status === "recognizing") return;
    const runId = ++runIdRef.current;
    if (!file.type.startsWith("image/")) {
      setState({ status: "error", reason: "notImage" });
      return;
    }
    const isCurrent = () => runIdRef.current === runId;
    setState({ status: "recognizing", progress: { phase: "preparing" } });
    sessionRef.current ??= createOcrSession();
    sessionRef.current
      .recognize(file, (progress) => {
        if (isCurrent()) setState({ status: "recognizing", progress });
      })
      .then(
        (text) => {
          if (isCurrent()) setState({ status: "done", text });
        },
        () => {
          if (isCurrent()) setState({ status: "error", reason: "engine", file });
        },
      );
  };

  const cancel = () => {
    runIdRef.current += 1;
    void sessionRef.current?.terminate();
    setState(IDLE);
  };

  return { state, start, cancel };
}

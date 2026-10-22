import type { LoggerMessage, Worker as TesseractWorker } from "tesseract.js";

export type OcrProgress = { phase: "preparing" } | { phase: "recognizing"; ratio: number };

export type OcrSession = {
  /** 이미지의 글자를 읽는다. 첫 호출에서 워커를 만들고 이후에는 재사용한다. */
  recognize(image: Blob, onProgress: (progress: OcrProgress) => void): Promise<string>;
  /** 워커를 닫는다. 진행 중인 recognize는 끝나지 않는다. 다음 recognize는 새 워커를 만든다. */
  terminate(): Promise<void>;
};

/**
 * 엔진 파일은 같은 출처의 /ocr/에서 받는다(ADR-021, 복사는 vite.config.ts). 라이브러리 기본값은 jsDelivr CDN이라 반드시 넘긴다.
 * 워커는 Blob URL 안에서 importScripts하므로 상대 경로가 아닌 절대 URL로 준다. corePath는 디렉터리(끝 /)여야 기기에 맞는 코어를 고른다.
 */
const OCR_ASSET_PATHS = {
  workerPath: "/ocr/worker.min.js",
  corePath: "/ocr/core/",
  langPath: "/ocr/lang/",
};
const OCR_LANGUAGE = "kor";
/** Tesseract OEM 1(LSTM 전용). 복사한 코어가 LSTM 전용 빌드다. */
const OEM_LSTM_ONLY = 1;
const RECOGNIZING_STATUS = "recognizing text";

/** 라이브러리 진행 로그 → 화면 진행 단계. 글자 읽기 외의 단계(코어·언어 데이터 로드, 초기화)는 모두 준비다. */
export function toOcrProgress(message: Pick<LoggerMessage, "status" | "progress">): OcrProgress {
  return message.status === RECOGNIZING_STATUS
    ? { phase: "recognizing", ratio: message.progress }
    : { phase: "preparing" };
}

function toAbsoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href;
}

type Listeners = {
  onProgress: (progress: OcrProgress) => void;
  onError: (error: unknown) => void;
};

/** 워커 하나와 그 워커의 진행·오류를 받을 곳. 인식마다 받을 곳만 바꿔 끼운다. */
type Engine = { worker: Promise<TesseractWorker>; listeners: Listeners };

const SILENT: Listeners = { onProgress: () => {}, onError: () => {} };

async function spawnWorker(listeners: Listeners): Promise<TesseractWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(OCR_LANGUAGE, OEM_LSTM_ONLY, {
    workerPath: toAbsoluteUrl(OCR_ASSET_PATHS.workerPath),
    corePath: toAbsoluteUrl(OCR_ASSET_PATHS.corePath),
    langPath: toAbsoluteUrl(OCR_ASSET_PATHS.langPath),
    logger: (message) => listeners.onProgress(toOcrProgress(message)),
    // 언어 데이터 로드·초기화 실패는 createWorker의 Promise를 끝내지 않고 여기로만 온다.
    errorHandler: (data: unknown) => listeners.onError(new Error(String(data))),
  });
}

function createEngine(): Engine {
  const listeners = { ...SILENT };
  return { worker: spawnWorker(listeners), listeners };
}

/** tesseract.js는 이 파일에서만 동적 import한다. 메인 번들과 분리되고, 테스트는 이 모듈을 통째로 모킹한다. */
export function createOcrSession(): OcrSession {
  let engine: Engine | null = null;

  const discard = (target: Engine) => {
    if (engine === target) engine = null;
    // 버린 워커의 늦은 진행·오류가 다음 인식에 섞이지 않게 끊는다.
    Object.assign(target.listeners, SILENT);
    // 준비 중이면 워커 객체가 아직 없다. 준비가 끝나는 대로 닫는다(실패했으면 닫을 것이 없다).
    target.worker.then(
      (worker) => worker.terminate(),
      () => {},
    );
  };

  return {
    recognize(image, onProgress) {
      return new Promise<string>((resolve, reject) => {
        const current = engine ?? createEngine();
        engine = current;
        // 실패한 워커는 다시 쓰지 않는다. 다시 시도하면 새로 만든다.
        const fail = (error: unknown) => {
          discard(current);
          reject(error);
        };
        Object.assign(current.listeners, { onProgress, onError: fail });
        current.worker
          .then((worker) => worker.recognize(image))
          .then(({ data }) => resolve(data.text), fail);
      });
    },
    async terminate() {
      if (engine !== null) discard(engine);
    },
  };
}

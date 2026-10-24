import { DEFAULT_TEXT_SIZE, TEXT_SIZES } from "@/lib/constants/textSize";

import { isOneOf } from "./isOneOf";

import type { TextSize, TextSizeStore } from "@/lib/types/textSize";

/** 새 키(기존 키는 건드리지 않는다, AC-0). 원문은 따옴표 없는 값 그대로 */
export const TEXT_SIZE_STORAGE_KEY = "loan-calculator/text-size";

/** 키 없음·모르는 값·접근 불가는 기본 크기다. */
export function loadTextSize(storage: Storage): TextSize {
  try {
    const raw = storage.getItem(TEXT_SIZE_STORAGE_KEY);
    return isOneOf(TEXT_SIZES, raw) ? raw : DEFAULT_TEXT_SIZE;
  } catch {
    return DEFAULT_TEXT_SIZE;
  }
}

/** `<html data-text-size>`. index.css가 이 값으로 글자·여백 토큰을 바꾼다. */
export function applyTextSize(size: TextSize) {
  document.documentElement.dataset.textSize = size;
}

/**
 * 메모리 상태가 원본이고 storage에는 최선으로 기록한다(접근 불가면 이 탭에서만 유지). 고를 때만 쓴다.
 * 첫 화면은 main.tsx가 렌더 전에 같은 값을 `<html>`에 적용한다(깜박임 방지).
 */
export function createTextSizeStore({ storage }: { storage: Storage }): TextSizeStore {
  const listeners = new Set<() => void>();
  let size = loadTextSize(storage);

  return {
    getSnapshot: () => size,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      size = next;
      applyTextSize(next);
      try {
        storage.setItem(TEXT_SIZE_STORAGE_KEY, next);
      } catch {
        // 접근 불가·용량 초과: 이 탭에서만 유지한다.
      }
      for (const listener of listeners) listener();
    },
  };
}

function throwUnavailable(): never {
  throw new Error("localStorage에 접근할 수 없습니다");
}

/** 모든 호출이 throw한다. 스토어는 이를 그대로 `unavailable`로 처리한다. */
const INACCESSIBLE_STORAGE: Storage = {
  get length(): number {
    return throwUnavailable();
  },
  clear: throwUnavailable,
  getItem: throwUnavailable,
  key: throwUnavailable,
  removeItem: throwUnavailable,
  setItem: throwUnavailable,
};

/**
 * 쿠키·사이트 데이터를 차단한 브라우저는 `window.localStorage`를 읽는 순간 throw한다.
 * 그때도 앱(계산)은 떠야 하므로, 저장소만 접근 불가로 보이게 한다.
 */
export function getBrowserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    return INACCESSIBLE_STORAGE;
  }
}

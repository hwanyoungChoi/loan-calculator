import type { SessionHintStore } from "@/lib/types/sessionHint";

/** 새 키(기존 키는 건드리지 않는다, AC-0). 값은 "1"이고 키가 있으면 로그인했던 브라우저다. */
export const SESSION_HINT_STORAGE_KEY = "loan-calculator/session-hint";

/** 저장소를 쓸 수 없으면 기록 없음으로 본다. 그런 브라우저는 로컬 목록도 쓸 수 없어 새는 쓰기가 없다. */
export function createSessionHintStore({ storage }: { storage: Storage }): SessionHintStore {
  return {
    has() {
      try {
        return storage.getItem(SESSION_HINT_STORAGE_KEY) !== null;
      } catch {
        return false;
      }
    },
    mark() {
      try {
        storage.setItem(SESSION_HINT_STORAGE_KEY, "1");
      } catch {
        // 접근 불가·용량 초과
      }
    },
    clear() {
      try {
        storage.removeItem(SESSION_HINT_STORAGE_KEY);
      } catch {
        // 접근 불가
      }
    },
  };
}

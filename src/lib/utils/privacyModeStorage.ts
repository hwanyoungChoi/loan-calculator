import type { PrivacyModeStore } from "@/lib/types/privacyMode";

/** 새 키(기존 키는 건드리지 않는다, AC-0). 원문은 JSON boolean */
export const PRIVACY_MODE_STORAGE_KEY = "loan-calculator/privacy-mode";

function loadPrivacyMode(storage: Storage): boolean {
  try {
    return storage.getItem(PRIVACY_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** 메모리 상태가 원본이고 storage에는 최선으로 기록한다(접근 불가면 이 탭에서만 유지). 켜고 끌 때만 쓴다. */
export function createPrivacyModeStore({ storage }: { storage: Storage }): PrivacyModeStore {
  const listeners = new Set<() => void>();
  let isOn = loadPrivacyMode(storage);

  return {
    getSnapshot: () => isOn,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      isOn = next;
      try {
        storage.setItem(PRIVACY_MODE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 접근 불가·용량 초과: 이 탭에서만 유지한다.
      }
      for (const listener of listeners) listener();
    },
  };
}

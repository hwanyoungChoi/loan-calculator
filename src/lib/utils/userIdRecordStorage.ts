import type { UserIdRecordStore } from "@/lib/types/storage";

/** 원문 → 기록. 키 없음·JSON 아님·문자열 배열이 아니면 빈 기록이다. */
export function parseUserIdRecord(rawText: string | null): string[] {
  if (rawText === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(rawText);
  } catch {
    return [];
  }
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

/**
 * 사용자 id 배열을 키 하나에 둔다. 기록은 최선으로 한다.
 * 못 쓰면 다음에 다시 올리지만, 서버가 계정 값이 있으면 덮지 않는다(COALESCE).
 */
export function createUserIdRecordStore({
  storage,
  key,
}: {
  storage: Storage;
  key: string;
}): UserIdRecordStore {
  function read(): string[] {
    try {
      return parseUserIdRecord(storage.getItem(key));
    } catch {
      return [];
    }
  }

  return {
    has: (userId) => read().includes(userId),
    add(userId) {
      const userIds = read();
      if (userIds.includes(userId)) return;
      try {
        storage.setItem(key, JSON.stringify([...userIds, userId]));
      } catch {
        // 접근 불가·용량 초과
      }
    },
  };
}

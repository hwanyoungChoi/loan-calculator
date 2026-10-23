import { SHARE_KINDS } from "@/lib/constants/share";

import { isOneOf } from "./isOneOf";
import { isIsoDateString } from "./validateListingFields";

import type { SentShare, SentShareStore } from "@/lib/types/sentShare";

export const SENT_SHARES_STORAGE_KEY = "loan-calculator/sent-shares";

function isSentShare(value: unknown): value is SentShare {
  if (typeof value !== "object" || value === null) return false;
  const { token, kind, ownerKey, expiresAt } = value as Record<string, unknown>;
  return (
    typeof token === "string" &&
    isOneOf(SHARE_KINDS, kind) &&
    typeof ownerKey === "string" &&
    isIsoDateString(expiresAt)
  );
}

/**
 * 원문 → 아직 열 수 있는 링크 목록. 키 없음은 빈 목록이다.
 * JSON 배열이 아니면 null: 남은 끊기 키를 덮어쓰지 않도록 쓰기를 건너뛴다.
 */
export function parseActiveSentShares(rawText: string | null, nowMs: number): SentShare[] | null {
  if (rawText === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(rawText);
  } catch {
    return null;
  }
  if (!Array.isArray(value)) return null;
  return value.filter(isSentShare).filter((share) => Date.parse(share.expiresAt) > nowMs);
}

/**
 * 키 `loan-calculator/sent-shares`. 쓸 때마다 만료된 항목을 걸러 내 무한히 늘지 않게 한다.
 * 기록은 최선으로 한다: 저장소를 쓸 수 없어도 링크와 이번 시트의 끊기는 그대로 동작하므로 알리지 않는다.
 */
export function createSentShareStore({
  storage,
  now,
}: {
  storage: Storage;
  /** unix 밀리초 */
  now: () => number;
}): SentShareStore {
  function rewrite(change: (shares: SentShare[]) => SentShare[]) {
    try {
      const shares = parseActiveSentShares(storage.getItem(SENT_SHARES_STORAGE_KEY), now());
      if (shares === null) return;
      storage.setItem(SENT_SHARES_STORAGE_KEY, JSON.stringify(change(shares)));
    } catch {
      // 접근 불가·용량 초과
    }
  }

  return {
    add: (share) => rewrite((shares) => [...shares, share]),
    remove: (token) => rewrite((shares) => shares.filter((share) => share.token !== token)),
  };
}

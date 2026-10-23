import type { AccountImports, AccountImportStore } from "@/lib/types/accountImport";

/** 새 키(기존 키는 읽기만 하고 건드리지 않는다, AC-0) */
export const ACCOUNT_IMPORTS_STORAGE_KEY = "loan-calculator/account-imports";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * 원문 → 기록. 키 없음·JSON이 아님은 빈 기록이고, 형식이 어긋난 사용자 항목은 버린다.
 * 이 키는 이전 기록일 뿐 사용자 데이터가 아니어서, 어긋나면 서버가 id 충돌을 건너뛰는 다시 보내기로 끝난다.
 */
export function parseAccountImports(rawText: string | null): AccountImports {
  if (rawText === null) return {};
  let value: unknown;
  try {
    value = JSON.parse(rawText);
  } catch {
    return {};
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string[]] => isStringArray(entry[1])),
  );
}

/** 키 `loan-calculator/account-imports`. 기록은 최선으로 한다(못 쓰면 다음 로그인에 다시 보내고 서버가 중복을 건너뛴다). */
export function createAccountImportStore({ storage }: { storage: Storage }): AccountImportStore {
  function read(): AccountImports {
    try {
      return parseAccountImports(storage.getItem(ACCOUNT_IMPORTS_STORAGE_KEY));
    } catch {
      return {};
    }
  }

  return {
    read,
    add(userId, ids) {
      const imports = read();
      const merged = [...new Set([...(imports[userId] ?? []), ...ids])];
      try {
        storage.setItem(
          ACCOUNT_IMPORTS_STORAGE_KEY,
          JSON.stringify({ ...imports, [userId]: merged }),
        );
      } catch {
        // 접근 불가·용량 초과
      }
    },
  };
}

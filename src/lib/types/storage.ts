/** localStorage 쓰기 결과. throw(시크릿 모드, 용량 초과)는 `unavailable`이다. */
export type StorageWriteResult = { ok: true } | { ok: false; reason: "unavailable" };

/** 첫 로그인 이전을 끝낸 사용자 id 기록(예산·직접 정렬 순서). 기록은 최선으로 한다. */
export type UserIdRecordStore = {
  /** 읽지 못하거나 형식이 어긋나면 기록 없음이다. */
  has: (userId: string) => boolean;
  add: (userId: string) => void;
};

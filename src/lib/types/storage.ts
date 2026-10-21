/** localStorage 쓰기 결과. throw(시크릿 모드, 용량 초과)는 `unavailable`이다. */
export type StorageWriteResult = { ok: true } | { ok: false; reason: "unavailable" };

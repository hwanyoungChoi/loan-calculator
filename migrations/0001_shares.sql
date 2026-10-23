-- 공유 링크 스냅샷(ADR-023 D1). 만료 행은 POST /api/shares 때 정리한다(크론 없음).
CREATE TABLE shares (
  token          TEXT PRIMARY KEY,                 -- 16바이트 랜덤 base64url(22자)
  kind           TEXT NOT NULL CHECK (kind IN ('listing', 'list')),
  payload        TEXT NOT NULL,                    -- JSON 배열: ShareListing[] (1~100개)
  owner_key_hash TEXT NOT NULL,                    -- 끊기 키의 SHA-256 hex
  created_at     INTEGER NOT NULL,                 -- unix 초
  expires_at     INTEGER NOT NULL                  -- unix 초, created_at + 30일
);
CREATE INDEX shares_expires_at ON shares (expires_at);

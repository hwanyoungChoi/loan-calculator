-- 카카오 로그인 계정·세션·서버 저장 목록(ADR-023 D3~D5). 카카오 토큰·닉네임·이메일은 저장하지 않는다.
CREATE TABLE users (
  id         TEXT PRIMARY KEY,                     -- 서버가 만든 16바이트 hex
  kakao_id   TEXT NOT NULL UNIQUE,                 -- 카카오 회원번호(Long)를 10진 문자열로
  created_at TEXT NOT NULL                         -- ISO 8601
);

CREATE TABLE sessions (
  id               TEXT PRIMARY KEY,               -- 토큰의 id 부분
  user_id          TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  secret_hash      TEXT NOT NULL,                  -- 토큰 secret의 SHA-256 hex
  created_at       INTEGER NOT NULL,               -- unix 초
  last_verified_at INTEGER NOT NULL                -- unix 초, 만료 판정 기준
);
CREATE INDEX sessions_user_id ON sessions (user_id);

-- 사용자당 최대 500행(서버가 검사). 시각은 클라이언트 형식(ISO 문자열)을 그대로 둔다.
CREATE TABLE listings (
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id         TEXT NOT NULL,                        -- 매물 id(로컬에서 옮긴 것은 로컬 id 그대로). ^[A-Za-z0-9_-]{1,64}$
  data       TEXT NOT NULL,                        -- JSON: ListingInput(알려진 키만, 빈 메모는 키 없음)
  created_at TEXT NOT NULL,                        -- ISO 8601
  updated_at TEXT NOT NULL,                        -- ISO 8601
  PRIMARY KEY (user_id, id)
);

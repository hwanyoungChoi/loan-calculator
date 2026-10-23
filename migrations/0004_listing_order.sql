-- 계정 직접 정렬 순서(ADR-026): 매물 id 배열의 JSON 문자열. NULL = 순서 없음. 값 검증은 서버가 한다.
-- 기존 users 행은 NULL이 되고 sessions·listings·shares는 건드리지 않는다.
ALTER TABLE users ADD COLUMN listing_order TEXT;

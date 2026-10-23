-- 계정 예산(만원, ADR-025 D1). NULL = 예산 없음. 값 검증(1~999,999,999 정수)은 서버가 한다.
-- 기존 users 행은 NULL이 되고 sessions·listings·shares는 건드리지 않는다.
ALTER TABLE users ADD COLUMN budget INTEGER;

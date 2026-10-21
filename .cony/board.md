# 주담대 한도·자기자금 계산기 (모바일 우선)

> 상태: 진행 중 · 마지막 업데이트: 2026-10-21 17:51

## 태스크

- [x] 1. 계산 엔드투엔드 최소 버전(규제 파일 + 계산 + 계산 화면 + 기준일 + 미확인 처리) — AC-1~5
- [x] 2. 매물 저장과 비교 — AC-6, AC-7
- [x] 3. 매일 쓰는 사용성 — AC-8

## 지금 하는 일

태스크 3 커밋·push 완료(테스트 358개). 리드가 최종 보고서 작성 → PR

## 최근 결정

- [ADR-010 매물 id는 crypto.getRandomValues로 만들고 주입 가능하게 한다](decisions/010-id-generation.md): C. 스토어 팩토리가 { storage, createId, now }를 받는다. id 검증은 비어 있지 않은 문자열까지만 한다.
- [ADR-009 보유 상태는 4값 라디오 하나, 기본값은 규제지역·무주택](decisions/009-borrower-ui.md): A. 초기값은 규제지역·무주택(일반). 결과 카드 상단에 조건 요약을 표시하고, 이후에는 draft가 마지막 선택을 기억한다.
- [ADR-008 화면 테스트에 @testing-library/react + jsdom을 도입한다](decisions/008-ui-testing.md): B. 로직이 있는 것(parseRoute, parseDraft, validateAmount, 정렬)은 순수 함수로도 뺀다. 결과 카드는 regulations를 prop으로 받는다.
- [ADR-007 매물은 입력값만 저장하고 표시할 때 다시 계산한다](decisions/007-store-inputs-only.md): A. 정렬과 카드 요약 함수는 regulations를 인자로 받는다.
- [ADR-006 부대비용(취득세 등)은 이번에 넣지 않는다](decisions/006-extra-costs.md): A. 결과 라벨은 "필요한 자기자금(부대비용 제외)".
- [ADR-005 한도 상한 구간은 max(매매가, KB시세)로 판단한다 (검토 권장)](decisions/005-cap-reference-price.md): C. 화면에 구간 판단에 쓴 가격을 표시하고, 두 가격이 다른 구간이면 경계 알림을 띄운다.
- [ADR-004 해시 라우트 2개, 계산 화면은 draft 하나만 본다](decisions/004-routing-state.md): 라우트는 #/ 와 #/listings 두 개. 카드를 누르면 draft를 {listingId, 저장본 값}으로 바꾸고 #/ 로 push한다. 계산 화면은 항상 draft만 본다. 목록 스크롤은 언마운트 때 모듈 변수에 저장해 복원한다.
- [ADR-003 디렉토리 구조와 @/ alias](decisions/003-directory.md): A. 규제 값은 src/lib/constants/loanRegulations.ts 한 파일, 타입은 src/lib/types/, satisfies Regulations를 쓰고 as const는 쓰지 않는다. react-query·axios는 쓰지 않는다(HTTP 없음).
- [ADR-002 금액은 만원 정수, LTV는 정수 퍼센트](decisions/002-money-unit.md): A. 금액은 만원 정수(최대 9자리), rate는 0~100 정수, 한도는 Math.floor(base * rate / 100).
- [ADR-001 매물 저장은 localStorage, 버전 필드 없이 전체 단위 손상 판정](decisions/001-storage.md): localStorage, 배열 JSON 그대로. 손상은 전체 단위로 판정하고 손상 상태에서는 reset 외 쓰기를 스토어가 차단한다. 초기화 전 원문 복사 버튼을 둔다.

## 사용자 확인 필요

- U1: 서민·실수요자 우대(규제지역 LTV 60%)를 조건에 넣을지 — 이번 범위에서는 제외하고 진행
- U2: 규제지역 생애최초 70%, 비수도권 생애최초 80%·1주택 미처분 60%를 금융위 hwpx 원문으로 확인해 주세요 — 값은 스펙대로 두고 진행
- U3: Cloudflare Pages에서 저장소 연결(빌드 pnpm build, 출력 dist, 프로덕션 브랜치 main)

## 막힌 것

없음

## PR

저장소: https://github.com/hwanyoungChoi/loan-calculator (private) · PR은 태스크 3 이후

<!-- spec: specs/mortgage-calculator.md -->

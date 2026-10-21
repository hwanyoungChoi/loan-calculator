# 작업 기록 — 주담대 계산기

## 기획

- 요청: 매매가·KB시세 중 낮은 금액 기준 주담대 한도·자기자금 계산기, 조건별 LTV, 매물 저장·비교. DSR은 다음 단계.
- 요청: GitHub 원격 저장소가 없으므로 push는 건너뛰고, PR 단계에서 사용자에게 묻는다.
- AI: planner가 금융위 1차 출처(S1~S6)로 LTV 12칸과 한도 상한을 채움. 웹 추출본이라 태스크 1-2에서 원문 대조 예정(A8).
- AI: U1(서민·실수요자 우대)은 이번 범위에서 빼고 사용자 확인 필요로 올림.
- 사용량: planner 첫 스펙 작성 · opus · 110k 토큰 · 10분 5초
- 사용량: client-dev 스펙 검토 · sonnet · 52k 토큰 · 2분 30초
- 사용량: tester 스펙 검토 · sonnet · 51k 토큰 · 2분 50초
- 사용량: planner 반론(D8)·새 결정 제안(N1~N5) · sonnet · 57k 토큰 · 1분 25초
- 토론: 결정 10건 채택 ([ADR-001](decisions/001-storage.md) ~ [ADR-010](decisions/010-id-generation.md)). D8은 tester 반대 → planner가 B로 수정.
- 사용량: planner 스펙 수정(결정 반영) · sonnet · 108k 토큰 · 5분 50초
- AI: 리드가 AC-3 표 헤더(구간 판단 가격)를 직접 정리.

## 태스크 1

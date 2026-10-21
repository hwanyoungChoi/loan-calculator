# ADR-004 해시 라우트 2개, 계산 화면은 draft 하나만 본다

- 상태: 채택
- 맥락: 화면 전환 방식(D4)과, 저장 매물을 열었을 때 draft·저장본 중 무엇을 보여줄지(N1), 목록 스크롤 복원(N4).
- 선택지: 라우팅 A 해시 + useSyncExternalStore / B react-router. 상태 출처 A #/listing/{id} 유지 + draft 우선 / B 라우트 없이 draft 교체 / C 저장본 우선
- 의견: planner(해시, N1-B, 스크롤 복원은 모듈 변수) / client-dev(해시 찬성, 상태 출처 모호 지적, 없는 id 처리 요구) / tester(parseRoute 순수 함수, 우선순위 정의 요구)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: 라우트는 #/ 와 #/listings 두 개. 카드를 누르면 draft를 {listingId, 저장본 값}으로 바꾸고 #/ 로 push한다. 계산 화면은 항상 draft만 본다. 목록 스크롤은 언마운트 때 모듈 변수에 저장해 복원한다.
- 이유: 입력값 출처가 하나라 새로고침해도 편집 중인 값이 남고, "없는 id" 경로가 사라진다. 공유 링크는 범위 밖이다.
- 뒤집을 조건: 매물 공유 링크(딥링크)가 필요해질 때.

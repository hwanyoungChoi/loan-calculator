# ADR-018 통합 테스트 상한을 8개 시나리오로 올린다 (ADR-008 개정)

- 상태: 채택
- 맥락: 새 화면 규칙(적용 전 덮어쓰기 금지, 오류 위치, 선택 기억)은 연결 단계에서만 깨진다(D10).
- 선택지: A 상한 8 / B 5 유지
- 의견: planner(A) / client-dev(찬성, 화면 규칙 로직은 순수 함수로 먼저 뺀다) / tester(조건부 찬성: 시나리오당 it 1개로 정의, 상태 렌더링은 표시 컴포넌트로 빼서 단위 테스트)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. 통합 테스트는 시나리오 8개, 시나리오당 it 1개. 상태 렌더링(로딩·빈·오류·행·더 보기)은 prop 기반 표시 컴포넌트, 오류 문구 매핑은 순수 함수로 빼서 단위 테스트한다.
- 이유: 테스트로 검증 가능한가(결정 기준 3).
- 뒤집을 조건: 통합 테스트가 느려지거나 불안정해질 때.

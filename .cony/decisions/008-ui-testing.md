# ADR-008 화면 테스트에 @testing-library/react + jsdom을 도입한다

- 상태: 채택
- 맥락: UI 테스트 도구(D8). 미확인 화면(AC-4)은 운영 규제 파일이 전부 확인값이라 수동으로 재현할 수 없다.
- 선택지: A 순수 함수 테스트만 / B testing-library + jsdom, 파일 단위 jsdom 환경, 통합 테스트 5개 이내
- 의견: planner(A → 반론 후 B로 수정) / client-dev(A 조건부 찬성, UI 로직 순수 함수 추출) / tester(A 반대, B 요구)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: B. 로직이 있는 것(parseRoute, parseDraft, validateAmount, 정렬)은 순수 함수로도 뺀다. 결과 카드는 regulations를 prop으로 받는다.
- 이유: CLAUDE.md 결정 기준 3(테스트로 검증 가능한가). 검증된 라이브러리이고 devDependencies만 늘어난다.
- 뒤집을 조건: React 19·vitest 5와 호환 문제가 1-1에서 풀리지 않을 때.

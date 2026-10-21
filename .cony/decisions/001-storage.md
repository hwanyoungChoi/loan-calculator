# ADR-001 매물 저장은 localStorage, 버전 필드 없이 전체 단위 손상 판정

- 상태: 채택
- 맥락: 백엔드가 없고 매물 여러 개를 저장·비교해야 한다. 저장 형식이 바뀔 때의 처리도 정해야 한다(D1, N5).
- 선택지: A localStorage / B IndexedDB(idb-keyval) / C URL에만 담기. 버전 필드 A 없음 / B {version, listings}
- 의견: planner(localStorage·버전 없음 추천) / client-dev(조건부 찬성, 동기 API가 useSyncExternalStore와 맞음. 손상 단위 정의 필요) / tester(손상 시 스토어 레벨 쓰기 차단 요구)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: localStorage, 배열 JSON 그대로. 손상은 전체 단위로 판정하고 손상 상태에서는 reset 외 쓰기를 스토어가 차단한다. 초기화 전 원문 복사 버튼을 둔다.
- 이유: 의존성 없이 가장 단순하다. 버전 필드는 마이그레이션 없이 하는 일이 없고, CLAUDE.md는 마이그레이션을 덧붙이지 않는다고 정한다.
- 뒤집을 조건: 여러 기기 동기화가 필요해지거나, iOS Safari 저장소 만료로 데이터 손실이 실제로 보고될 때.

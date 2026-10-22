# ADR-012 사용자 지정 LTV는 선택 필드 customLtvRate?로 저장한다 (ADR-001 보강)

- 상태: 채택
- 맥락: 직접 지정한 LTV를 저장 매물에 넣어야 한다(D3). 1차 저장 목록은 버전 필드가 없다(ADR-001).
- 선택지: A Listing·LoanInput 모두 선택 필드 customLtvRate?: number / B 필수 필드 + null
- 의견: planner(A) / client-dev(찬성, 단 LoanInput도 같은 표현으로 — 지금 안은 기존 매물 전부가 사용자 지정으로 계산되는 버그) / backend-dev(찬성, 정규화는 한 함수에만) / tester(찬성, 1차 형식 JSON 문자열 회귀 테스트로 고정)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. "키 없음 = 규제 LTV". 판정은 typeof === "number" 하나로 하고 null은 저장하지 않는다. 검증은 typeof → 정수 → 0~100. 규제로 되돌려 저장하면 키를 지운다. ADR-001 보강: 저장 형식 변경은 선택 필드·enum 값 추가로만 하고, 롤백 시 옛 코드가 새 enum을 corrupt로 판정할 수 있음을 받아들인다(데이터 소실 아님, 원문 복사 가능).
- 이유: 기존 데이터가 그대로 유효해 호환 코드가 필요 없다.
- 뒤집을 조건: 서버 저장(D1)으로 옮겨 스키마 버전 관리가 필요해질 때.

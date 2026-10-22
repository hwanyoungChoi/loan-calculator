# ADR-017 실거래가와 붙여넣기는 계산 화면의 시트, 공통 Sheet 프레임, 조회 상태는 draft와 분리

- 상태: 채택
- 맥락: 새 화면 위치(D8)와 상태 위치. 시트가 3개로 늘어난다.
- 선택지: A 계산 화면 안 시트(라우트 2개 유지) / B 새 탭·라우트
- 의견: planner(A) / client-dev(조건부 찬성: 공통 Sheet 프레임 추출, 열린 시트 상태 하나, 시트 높이·행 2줄, 뒤로 가기 결정, 시군구·단지명 기억은 draft와 분리) / tester(조회 상태 수명 정의 요구)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. SaveSheet에서 공통 Sheet 프레임(backdrop·Esc·포커스 복귀·inert)을 먼저 추출하고 열린 시트는 useState<"save"|"paste"|"trades"|null> 하나로 관리. 시트는 히스토리에 넣지 않는다(저장 시트와 같음). 실거래가 조회 기억(시군구 코드)은 별도 키 loan-calculator/trade-lookup에 두고 draft는 customLtvRate만 늘린다. 단지명 필터는 시트의 제출된 파라미터 상태이고 새 계산·매물 열기에서 비운다. 붙여넣기 적용은 새 매물 계산으로 보고 kbPrice를 비우고 listingId를 해제한다. 미리보기는 입력 즉시 갱신.
- 이유: ADR-004 라우트 2개를 유지하고, draft 통째 교체(listingToDraft)가 조회 기억을 지우지 않게 한다.
- 뒤집을 조건: 실거래가 시트에서 뒤로 가기로 앱을 벗어나는 문제가 실제로 반복될 때(그때 히스토리 항목 추가).

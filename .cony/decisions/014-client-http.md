# ADR-014 클라이언트 HTTP는 react-query + fetch 래퍼, 자동 재시도 없음 (ADR-003 개정)

- 상태: 채택
- 맥락: 첫 API 호출이 생겼다(D5). ADR-003은 HTTP가 없어 react-query를 쓰지 않는다고 했다.
- 선택지: A react-query + fetch 래퍼 / B 직접 fetch + useState
- 의견: planner(A) / client-dev(조건부 찬성: axios 대신 fetch 래퍼 명시, 키 이름 목록 규칙, retry false) / tester(재시도 없애고 "다시 시도" 버튼에 맡길 것)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. CONVENTIONS의 "모든 API 요청은 react-query 훅" 규칙을 따른다. lib/api/client.ts는 fetch 래퍼 apiClient.get<T>(path, { params }), lib/api/queryClient.ts에 QueryClient. 쿼리 키 aptTradeListQueryKey(params) → ["aptTrade","list",params]. retry: false, staleTime 10분. useAptTrades는 실거래가 시트 안에서만 호출. axios는 넣지 않는다. ADR-003의 "react-query 미사용"은 이 결정으로 대체.
- 이유: 컨벤션과 검증된 라이브러리. 재시도는 일일 한도를 더 쓰고 오류 표시를 늦춘다.
- 뒤집을 조건: 없음(컨벤션 변경 시).

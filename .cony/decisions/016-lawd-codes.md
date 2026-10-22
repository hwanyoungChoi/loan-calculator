# ADR-016 법정동코드는 정적 시군구 목록, 서버도 같은 목록으로 검증

- 상태: 채택
- 맥락: 사용자가 지역을 고르는 방법(D7).
- 선택지: A 정적 시도→시군구 목록 / B 주소 검색 API
- 의견: planner(A) / backend-dev(조건부 찬성: 서버도 같은 목록으로 lawdCd 검증, 2026-07 신설 구 스모크 확인) / client-dev(네이티브 select 2단이 360px에 적합) / tester(최소 개수·빈 값 검사)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. src/lib/constants/lawdCodes.ts 한 파일을 클라이언트와 서버가 함께 쓴다(서버는 상대 경로 import). 2-3 스모크에 화성시·동탄구 등 최근 개편 지역을 넣는다.
- 이유: 약 250개로 거의 바뀌지 않고 오프라인·테스트가 쉽다.
- 뒤집을 조건: 개편 지역에서 목록과 API가 계속 어긋날 때.

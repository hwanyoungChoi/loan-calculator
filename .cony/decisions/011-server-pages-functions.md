# ADR-011 서버는 Cloudflare Pages Functions, 호출 증폭은 캐시와 입력 검증으로 막는다

- 상태: 채택
- 맥락: 실거래가 API 서비스키를 숨기려면 서버가 처음 필요하다(D1). 공개 엔드포인트라 일일 한도(10,000건) 소진 위험이 있다.
- 선택지: A Pages Functions / B Workers
- 의견: planner(A, 이미 Pages 연결 중) / backend-dev(조건부 찬성: Cloudflare IP 차단 여부 조기 확인, server/가 PagesFunction 타입에 의존하지 않을 것, 캐시·검증으로 증폭 완화) / tester(키 없이 CI 검증 가능)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. 진입점 functions/api/apt-trades.ts는 얇게, 로직은 server/aptTrades/*(상대 경로 import, PagesFunction 타입 비의존). 업스트림 달 단위 응답은 Cache API로 캐시(키에 서비스키·aptName 제외), lawdCd는 LAWD_CODES에 있는 값만, 성공 응답 Cache-Control public max-age=600·오류 no-store. 요청 전체에 타임아웃 신호 하나, 예상 못 한 예외는 500 internal JSON. 오류 매핑: 22 quotaExceeded·23 rateLimited 분리, 20/30/31 → 503 notConfigured. 2-1 직후 Pages 미리보기에서 Cloudflare IP로 업스트림이 호출되는지 먼저 확인한다.
- 이유: 엔드포인트 1개라 가장 단순하고, 로직이 분리돼 B로 옮길 때 진입점만 바뀐다.
- 뒤집을 조건: Cloudflare IP가 업스트림에 막히거나, Rate Limiting·Cron 등 Workers 전용 기능이 필요해질 때.

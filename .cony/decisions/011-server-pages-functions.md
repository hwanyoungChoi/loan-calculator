# ADR-011 서버는 Cloudflare Pages Functions, 호출 증폭은 캐시와 입력 검증으로 막는다

- 상태: 채택
- 맥락: 실거래가 API 서비스키를 숨기려면 서버가 처음 필요하다(D1). 공개 엔드포인트라 일일 한도(10,000건) 소진 위험이 있다.
- 선택지: A Pages Functions / B Workers
- 의견: planner(A, 이미 Pages 연결 중) / backend-dev(조건부 찬성: Cloudflare IP 차단 여부 조기 확인, server/가 PagesFunction 타입에 의존하지 않을 것, 캐시·검증으로 증폭 완화) / tester(키 없이 CI 검증 가능)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. 진입점 functions/api/apt-trades.ts는 얇게, 로직은 server/aptTrades/*(상대 경로 import, PagesFunction 타입 비의존). 업스트림 달 단위 응답은 Cache API로 캐시(키에 서비스키·aptName 제외), lawdCd는 LAWD_CODES에 있는 값만, 성공 응답 Cache-Control public max-age=600·오류 no-store. 요청 전체에 타임아웃 신호 하나, 예상 못 한 예외는 500 internal JSON. 오류 매핑: 22 quotaExceeded·23 rateLimited 분리, 20/30/31 → 503 notConfigured. 2-1 직후 Pages 미리보기에서 Cloudflare IP로 업스트림이 호출되는지 먼저 확인한다.
- 이유: 엔드포인트 1개라 가장 단순하고, 로직이 분리돼 B로 옮길 때 진입점만 바뀐다.
- 뒤집을 조건: Cloudflare IP가 업스트림에 막히거나, Rate Limiting·Cron 등 Workers 전용 기능이 필요해질 때.

## 개정 (2026-10-22): Pages Functions → Workers + Static Assets

- 맥락: 사용자가 Cloudflare 대시보드에서 저장소를 Pages가 아니라 Workers(Workers Builds)로 연결했다. PR #2에서 "Workers Builds" 체크가 실패했다(Pages 형식 wrangler.jsonc를 wrangler deploy가 받아들이지 않는 것으로 판단, 대시보드 로그는 못 읽음).
- 결정: Workers + Static Assets. `worker/index.ts`가 `/api/apt-trades`를 `server/aptTrades/handleAptTrades`로 넘기고, 나머지는 `env.ASSETS`(dist, SPA 대체). `run_worker_first: ["/api/*"]`, `build.command: "pnpm build"`. `functions/`는 삭제했고 `server/`는 그대로다.
- 이유: 실제 배포 대상에 맞춘다. 로직을 `server/`에 분리해 둔 덕분에 진입점과 설정만 바뀌었다(이 ADR의 "뒤집을 조건").
- 확인: 로컬 wrangler dev(실제 키) API 200·400·405·SPA 대체, `wrangler deploy --dry-run`·`versions upload --dry-run` 성공.
- 뒤집을 조건: Pages로 다시 연결할 때.

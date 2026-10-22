# loan-calculator

주담대 한도·자기자금 계산기. Vite + React 클라이언트와 Cloudflare Pages Functions(`/api/apt-trades`, 국토교통부 실거래가 프록시)로 이루어져 있다.

## 로컬 실행

- 화면만: `pnpm dev`. `/api` 요청은 Vite proxy가 `http://localhost:8788`로 넘긴다.
- API 포함: 터미널 두 개를 쓴다.
  1. `pnpm dev:api` — `pnpm build && wrangler pages dev`(8788). `wrangler pages dev`는 `dist`가 한 번 있으면 되므로, 이후에는 `pnpm exec wrangler pages dev`만 다시 띄워도 된다(화면 변경은 Vite가 서비스한다).
  2. `pnpm dev`
- 서비스키: 프로젝트 루트 `.dev.vars`에 `MOLIT_SERVICE_KEY=<공공데이터포털 Decoding 키>`를 둔다(`.dev.vars.example` 참고, git 제외). `.env`와 함께 쓰지 않는다. 키가 없으면 API는 503 `notConfigured`를 돌려준다.
- 배포: Cloudflare Pages 프로젝트 Settings → Variables and Secrets에 `MOLIT_SERVICE_KEY`를 Production·Preview 모두 Encrypt로 등록한다.

## 검증

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
bash scripts/smoke-api.sh                         # wrangler pages dev가 떠 있을 때. 키 없음: 400·405·503
bash scripts/smoke-api.sh http://localhost:8788 key   # 키 있음: 400·405·200, 응답에 키 없음
node scripts/probeUpstream.ts [LAWD_CD ...]       # 업스트림 원문 확인(.wrangler/probe/)
```

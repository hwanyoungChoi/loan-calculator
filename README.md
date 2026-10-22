# mortgage-fit (모기지핏)

주담대 한도·자기자금 계산기. Vite + React 클라이언트를 Cloudflare Workers Static Assets로 서비스하고, 같은 Worker가 `/api/apt-trades`(국토교통부 실거래가 프록시)를 처리한다. 진입점은 `worker/index.ts`, API 로직은 `server/`에 있다.

## 로컬 실행

- 화면만: `pnpm dev`. `/api` 요청은 Vite proxy가 `http://localhost:8788`로 넘긴다.
- API 포함: 터미널 두 개를 쓴다.
  1. `pnpm dev:api` — `wrangler dev --port 8788`. 시작할 때 `wrangler.jsonc`의 `build.command`(`pnpm build`)로 `dist`를 만들고, `src/`가 바뀌면 다시 빌드한다. 화면 작업은 Vite(터미널 2)로 보면 된다.
  2. `pnpm dev`
- 서비스키: 프로젝트 루트 `.dev.vars`에 `MOLIT_SERVICE_KEY=<공공데이터포털 Decoding 키>`를 둔다(`.dev.vars.example` 참고, git 제외). `.env`와 함께 쓰지 않는다. 키가 없으면 API는 503 `notConfigured`를 돌려준다.
- 배포: Workers Builds(GitHub 연결)가 `wrangler deploy`(비프로덕션 브랜치는 `wrangler versions upload`)를 실행하고, 이때 `build.command`가 먼저 돈다. 시크릿 `MOLIT_SERVICE_KEY`는 Worker의 Settings → Variables and Secrets에 Secret으로 등록한다.

## 검증

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm build:worker                                  # wrangler deploy --dry-run(배포·로그인 없음)
bash scripts/smoke-api.sh                          # pnpm dev:api가 떠 있을 때. 키 없음: 400·405·503
bash scripts/smoke-api.sh http://localhost:8788 key   # 키 있음: 400·405·200, 응답에 키 없음
node scripts/probeUpstream.ts [LAWD_CD ...]        # 업스트림 원문 확인(.wrangler/probe/)
```

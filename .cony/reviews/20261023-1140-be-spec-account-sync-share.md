# account-sync-share 스펙 — be 검토

날짜: 2026-10-23 · 대상: `.cony/specs/account-sync-share.md` · 관점: D1 스키마·마이그레이션, Worker 라우팅, API 계약, 세션·CSRF, 카카오 OAuth 서버 측, 무결성·중복 방지

## 판정: 조건부 통과

구조(공유 스냅샷 / 계정 / 매물 import 3단계)와 API 계약은 구현 가능하고 서버 쪽 범위도 적절하다. 아래 "조건"의 C1~C4는 구현 전에 스펙에 한 줄씩 반영하거나 확인해야 한다(막히거나 AC가 흔들리는 항목). C5~C7은 구현 때 반영하면 된다.

확인한 사실: `wrangler.jsonc`에 `DB` 바인딩이 있고 `migrations/` 디렉토리는 아직 없다. `worker/index.ts`는 `/api/apt-trades`만 분기하고 나머지는 `ASSETS`로 넘긴다. `tsconfig.worker.json`은 `@/` 별칭이 없다(상대 경로만). 검증 함수 `isListing`은 `src/lib/utils/listingStorage.ts`에 있고 그 안에서 `@/lib/constants/loanConditions`를 import한다. 추론: 아래 C1~C2의 한도 관련 내용은 Cloudflare 문서를 이번 검토에서 열어 보지 못했고 기억에 근거한 것이다(미확인 표시).

## 근거

1. **서버가 클라이언트 검증을 그대로 재사용하는 계획은 현재 코드로는 타입 검사에서 깨진다.** `validateListingFields`가 가져올 `loanConditions.ts`는 `@/lib/types/...`를 type-only로 import하는데(1~2행), `tsconfig.worker.json`은 `paths`가 없다. `tsc -b`(build 스크립트)가 worker 프로젝트에서 TS2307로 실패한다. 번들러(esbuild)는 type import를 지워 통과하므로 `wrangler`만 돌리면 못 잡는다.
2. **import의 "행마다 prepared statement 500개를 `db.batch`"는 한도 미확인이다.** 스펙은 바인딩 수 제한만 보고 있다. Workers는 호출당 D1 쿼리(서브리퀘스트) 수 한도가 있고(무료 50 / 유료 1000으로 기억, 배치가 문장 단위로 세어지는지 **미확인**), 로컬 `wrangler dev`는 이 한도를 재현하지 않아 AC에서 안 잡힌다.
3. **서버가 받는 `id`·시각의 검증 규칙이 스펙에 없다.** ADR-010은 id 검증을 "비어 있지 않은 문자열"까지로 정했고(`isListing`도 그렇다), import는 클라이언트가 보낸 id를 PK로, `createdAt`·`updatedAt`을 그대로 저장한다. 서버 경계에서는 길이·문자 집합 제한이 필요하다(경로 `/api/listings/{id}`에도 들어간다).

## 조건

- **C1 (스펙 보완): 공유 모듈의 import는 전부 상대 경로.** `validateListingFields`와 그것이 끌어오는 파일(`loanConditions.ts`의 `@/` type import 포함)을 상대 경로로 바꾸거나, `tsconfig.worker.json`에 `paths`를 추가해야 한다. 어느 쪽이든 1-1 작업 항목에 적는다. DOM 타입에 의존하지 않는 순수 파일에 둔다(worker tsconfig는 `lib: ES2023`만).
- **C2 (확인 후 확정): import 쿼리 형태.** 문장 500개 배치 대신 (a) 다중 행 `INSERT … VALUES (…),(…) ON CONFLICT DO NOTHING`을 20행(5컬럼×20=100 바인딩)씩 묶어 배치로, 또는 (b) `INSERT … SELECT … FROM json_each(?)` 한 문장 중 하나로 한다. 문장 수가 50 아래로 유지되는지가 기준이다. 어느 쪽이든 imported 수는 각 결과의 `meta.changes` 합, `skipped = 보낸 수 - imported`. 배치는 원자적이라 중간 실패 시 일부만 들어가지 않는다(확인한 D1 동작에 대한 기억, 구현 때 `--local`로 확인).
- **C3 (스펙 보완): 서버 쪽 필드 규칙을 계약에 적는다.** 제안: `id`는 `^[A-Za-z0-9_-]{1,64}$`(이전 형식의 id를 깨지 않도록 hex 32자로 좁히지 않음), `createdAt`·`updatedAt`은 `isIsoDateString`과 같은 규칙, 같은 요청에 id 중복이 있으면 뒤의 것은 `skipped`. `POST/PUT`의 `name` 등은 `validateListingFields`. 모두 400 `invalidParams`. 사용자당 매물 수 상한(예: 500)은 없어서 `GET /api/listings`가 무한히 커질 수 있다. 인증 뒤라 위험은 낮지만 상한을 정할지 결정하면 좋다(정하면 초과 시 400 `invalidParams`로 충분, 새 코드 불필요).
- **C4 (스펙 모순 정리): 만료 공유의 410/404.** "만료 행은 GET 시 410을 돌려주고 지운다"면 두 번째 GET부터는 404이고, POST 때마다 만료 행을 지우므로 410은 거의 도달하지 않는다. AC-3의 410 확인은 첫 GET에서만 성립한다. 제안: GET은 지우지 않는다(정리는 POST 때만). 그러면 정리 전까지 일관되게 410이고, 정리 후 404다. 클라이언트는 둘을 같은 화면으로 처리하므로 영향 없다. 계약에 "410 또는 404 모두 사라진 링크"라고 적는다.
- **C5 (구현): 라우팅.** `/api/*`가 모두 Worker로 오므로(`run_worker_first`) 표에 없는 `/api/*` 경로는 `ASSETS`로 넘기지 말고 JSON 404 `notFound`를 돌려준다(그대로 두면 SPA 대체로 index.html이 200으로 나온다). 경로는 있고 메서드가 다르면 405 `methodNotAllowed`(+`Allow`). `Env`에 `DB: D1Database`, 시크릿 둘(optional)을 추가한다.
- **C6 (구현): 본문 한도.** 512KB는 `Content-Length`만 보지 말고 본문을 스트림으로 읽으며 바이트를 세어 413을 낸다(chunked 요청 우회 방지). 익명 `POST /api/shares`는 Origin 검사가 curl로 위조 가능해 저장소 채우기를 막지 못한다. 공유 한도를 매물 수 100개·본문 128KB 정도로 낮추거나 Cloudflare 대시보드의 Rate limiting 규칙(코드 불필요)을 쓰는 것을 권한다. 스펙의 "호출 제한은 다음 단계" 판단은 유지 가능하나 위험(저장 공간 소진)을 U-항목이나 가정에 한 줄 적을 것. 참고로 A3의 500개×메모 500자(한글 3바이트)는 이론상 750KB라 512KB를 넘는다. 실사용에서는 문제없으나 "500개"와 "512KB"가 동시에 보장되지 않음을 알고 있어야 한다.
- **C7 (구현·계약 주의): PUT의 메모 보존.** `memo` 키가 없으면 기존 메모 유지는 SELECT 후 UPDATE로 하면 두 기기 사이 좁은 경합에서 AC-8이 말하는 손실이 재현된다. 한 문장 UPDATE로 한다(예: `data = CASE WHEN json_extract(data,'$.memo') IS NULL THEN ?1 ELSE json_set(?1,'$.memo',json_extract(data,'$.memo')) END`; `memo:""`는 서버가 키를 지운 JSON을 만들어 보낸다). 반대 방향 위험: 메모 수정도 PUT 전체 필드라서 오래된 캐시로 메모를 고치면 다른 기기에서 바꾼 매매가를 되돌린다. U4 "마지막 저장이 이김"의 의도 범위 안일 수 있으나, 메모 전용 `PATCH /api/listings/{id} { memo }`가 가장 작은 해법이다. 추가할지는 pm 판단(범위 확대).

## 세부 확인 (문제 아님, 구현 때 반영)

- `users` upsert는 id가 바뀌지 않게 `INSERT … ON CONFLICT(kakao_id) DO NOTHING` 후 `SELECT id`. `DO UPDATE`로 새 id를 덮어쓰면 기존 listings가 끊긴다.
- 세션: 해시끼리 비교하므로 타이밍 공격 여지는 작다. Workers에는 `crypto.subtle.timingSafeEqual`이 있어 쓰면 된다. 쿠키 값 형식 파싱 실패·길이 이상은 401. 슬라이딩 갱신(`Set-Cookie` 재발급)은 인증을 거치는 모든 응답(`/api/me` 포함)에서 한 곳에서 처리해야 한다. 로그인 성공 시 같은 사용자의 만료 세션을 함께 지우면 정리 크론 없이도 쌓이지 않는다.
- D1은 FK를 기본 강제하므로 `ON DELETE CASCADE`와 마이그레이션 테이블 순서(users → sessions, listings)는 스펙대로 동작한다.
- OAuth: `mf_oauth_state` 쿠키 `Path=/api/auth/kakao`와 `SameSite=Lax`는 카카오에서 돌아오는 최상위 GET에 실리므로 맞다. 콜백을 새로고침하면 state 쿠키가 이미 삭제돼 `login=failed`가 보이면서 실제로는 로그인된 상태가 될 수 있다(표시만 어색, 데이터 문제 없음). 토큰 호출에 `AbortSignal.timeout(10_000)`. `redirect_uri`를 요청 origin으로 만드는 A5는 Cloudflare 라우팅 뒤에서 Host 위조가 안 되므로 허용 가능. 고정 값(예: 환경변수)이 더 안전하나 새 변수를 요구하므로 지금은 유지.
- 해시 라우트 링크(D2-A)는 토큰이 `Referer`와 서버 접근 로그의 페이지 URL에 남지 않는다는 보안상 이점이 있다(API 경로에는 남는다).
- 마이그레이션: 0001은 태스크 1 PR, 0002는 2·3 PR에 들어가고 둘 다 추가 테이블뿐이라 "원격 적용 → 머지" 순서면 기존 코드와 충돌 없다. 이미 적용한 파일은 고치지 않는다. 시각 컬럼이 shares·sessions는 unix 초, users·listings는 ISO 문자열로 섞여 있다(listings는 클라이언트 형식 유지가 목적이라 타당, 의도라면 스펙에 한 줄).
- 이전 대상 매물 시각을 import가 그대로 저장하므로 정렬은 클라이언트의 문자열/Date 비교 결과가 오프셋 표기("+09:00")에 영향을 받는다. 기존 파서가 이미 허용하는 형식이라 새 문제는 아니다.
- 기존 서버 테스트(`handleAptTrades.test.ts`)가 `ApiError`를 `aptTrade.ts`에서 import한다. `api.ts`로 옮기면 해당 import를 같이 고쳐야 `pnpm test`·`tsc -b`가 통과한다(새 테스트 작성은 아님).

## 결정 필요 D1~D5

| 항목                                  | 의견        | 근거 한 줄                                                                                                                                      |
| ------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 공유 저장 위치 (A D1 스냅샷)       | 찬성        | `DB` 바인딩이 이미 있고 만료·끊기는 서버 상태가 필요하며 행 크기(512KB)는 D1 행 한도(2MB) 안이다.                                               |
| D2 링크 형식 (A 해시 라우트)          | 찬성        | 서버 라우팅은 `run_worker_first: ["/api/*"]` 그대로이고 토큰이 Referer·페이지 로그에 안 남는다(B는 `/s/*` 추가·OG 처리가 서버 작업으로 늘어남). |
| D3 클라이언트 구조 (A 서버 원본 + 훅) | 찬성        | 서버 계약(REST 요청-응답, 서버 시각 `updatedAt`, import 멱등)이 A에 맞고 C의 낙관적 반영·롤백은 서버가 보장해 줄 수 없는 순서성을 요구한다.     |
| D4 매물 JSON 저장 (A)                 | 조건부 찬성 | 조건: 쓰기마다 공유 검증 함수 + id·시각 검증(C3)을 서버 경계에서 하고, 메모 보존은 단일 UPDATE로 한다(C7).                                      |
| D5 세션 (A D1 sessions)               | 찬성        | 로그아웃 즉시 폐기(AC-8)가 되고 요청당 D1 읽기 1회는 이 규모에서 충분하며 쓰기는 1시간에 한 번뿐이다.                                           |

## 리스크

- C2를 확인 없이 스펙대로 구현하면 로컬에서는 통과하고 운영에서만 큰 import(수십~수백 개)가 실패할 수 있다(미확인 한도).
- 익명 공유 생성은 저장 공간 소진 위험이 있다(C6). 사용자 규모가 작아 즉시 문제는 아니다.
- 메모/필드 마지막 저장 우선 충돌은 좁은 경합과 오래된 캐시 시나리오에서 손실이 생긴다(C7). 사용자에게 알려진 U4 범위 안인지 확인 필요.
- PR 미리보기가 운영 D1을 쓰는지 미확인(A11). 마이그레이션 적용 전 미리보기는 500이 날 수 있으나 운영 데이터 위험은 쓰기를 안 하는 한 없다.
- 카카오 로그인은 키가 등록됐어도 Redirect URI·사용 설정 ON·클라이언트 시크릿 활성 여부를 실제 호출로 확인하기 전까지 AC-6 미검증이다(스펙의 "미확인" 목록과 동일).

# 공유 링크 · 카카오 로그인 동기화 · 로컬 데이터 이전

> 상태: ADR-023(`../decisions/023-account-sync-share.md`)으로 D1~D5가 모두 A로 결정됐고, be·fe 검토(`../reviews/20261023-1140-be-spec-account-sync-share.md`, `../reviews/20261023-1140-fe-spec-account-sync-share.md`)의 조건을 이 문서에 반영했다.

## 목표

로그인 없이도 지금처럼 쓰면서, 저장 목록이나 매물 하나를 링크로 다른 사람에게 넘긴다(받는 사람 목록에는 값만 복사돼 따로 관리된다). 카카오로 로그인하면 저장 목록을 서버에 두어 어느 기기에서든 같은 목록을 보고, 이미 이 기기에 저장해 둔 매물은 로그인할 때 자동으로 계정으로 옮겨져 사라지지 않는다.

## 사용자 시나리오

1. (공유, 로그인 없음) 남편이 저장 목록에서 매물 카드의 [공유] → [링크 만들기] → [공유하기]로 카카오톡에 링크를 보낸다.
2. (받기) 아내가 링크를 연다 → "공유받은 매물" 화면에서 현재 규제로 다시 계산한 필요한 자기자금을 본다 → [내 목록에 추가] → 저장 목록으로 넘어가고 "1개를 내 목록에 추가했습니다" 알림이 뜬다. 이 매물은 아내 목록의 새 항목이고, 남편이 원본을 고치거나 지워도 바뀌지 않는다.
3. (목록 공유) 저장 목록 위 [목록 공유]로 지금 목록 전체(최대 100개)를 링크 하나로 보낸다.
4. (끊기) 잘못 보낸 링크는 만든 직후 시트에서 [이 링크 끊기]로 바로 닫는다. 끊거나 만료된 링크를 열면 "만료되었거나 끊긴 링크입니다"가 보인다.
5. (로그인) 저장 목록 위 계정 줄의 [카카오로 로그인] → 카카오 동의 화면 → 저장 목록으로 돌아오고 "카카오 계정에 저장 중"이 보인다.
6. (이전) 이 기기에 매물 5개가 있던 사람이 처음 로그인하면, 목록이 잠시 로딩으로 있다가 5개가 자동으로 계정으로 옮겨지고 "이 기기의 매물 5개를 계정으로 옮겼습니다"가 뜬다. 이 기기의 로컬 데이터는 지우지 않는다. 이 기기에서 이미 다른 카카오 계정으로 옮긴 기록이 있으면(한 기기를 둘이 쓰는 경우) 옮기기 전에 한 번 묻는다.
7. (여러 기기) 휴대폰에서 저장한 매물을 PC에서 같은 계정으로 로그인해 본다. 고치기·메모·삭제도 서로 반영된다.
8. (로그아웃) [로그아웃]하면 이 기기에 로그인 전부터 있던 로컬 목록으로 돌아간다. 서버 목록은 이 기기에 남기지 않는다.

## 참고한 사례

- **카카오 로그인 REST API(공식 문서, 2026-10-23 WebFetch로 확인)**: 인가 코드 → 토큰 → 사용자 정보 순서. 아래 "카카오 로그인 흐름"에 엔드포인트·파라미터·응답 필드를 확인한 범위만 적었다. 회원번호(`id`)는 "기본 제공 정보"라 동의항목 없이 받을 수 있고, 문서에 "회원 체계가 없거나 사용자 정보를 활용하지 않는 서비스는, 동의항목을 설정하지 않아도 됩니다"라는 문장이 있다 → 동의항목 0개(회원번호만)를 기본안으로 한다.
  - https://developers.kakao.com/docs/ko/kakaologin/rest-api · https://developers.kakao.com/docs/ko/kakaologin/prerequisite · https://developers.kakao.com/docs/ko/kakaologin/utilize
- **Notion "공개 페이지 복제(Duplicate)"**: 공개 페이지를 내 워크스페이스로 복제하면 원본과 독립된 사본이 된다. → 공유받기 = "링크를 열고 [내 목록에 추가]하면 독립 사본"으로 가져온다. https://www.notion.com/help/duplicate-public-pages
- **Excalidraw 공유 링크**: 링크를 만든 시점의 스냅샷이고, 이후 원본을 고쳐도 링크 내용은 바뀌지 않으며 새 링크를 만들어야 한다. → 공유는 생성 시점 스냅샷을 서버에 저장한다. 목록이 바뀌면 새 링크를 만든다.
- **이커머스 비회원 장바구니 → 로그인 시 병합(commercetools 문서)**: 로그인할 때 비회원 카트를 계정 카트에 합치는 전략(항목 병합 / 최근 것만 / 사용자에게 묻기)을 고른다. → 로컬 매물을 계정 목록에 **항목 병합**하고, 같은 항목 판정은 id로 한다. 기본은 묻지 않고 합치되, 이 기기에서 다른 계정으로 이미 합친 기록이 있으면 "사용자에게 묻기"를 쓴다. https://docs.commercetools.com/learning-implement-carts-and-shopping-lists/implement-carts/manage-cart-sessions-and-merges
- **Lucia 세션 예제(`lucia-auth/lucia` code/auth_session.ts)**: 토큰 `id.secret`, secret 32바이트, DB에는 SHA-256 해시만 저장, 마지막 확인 시각 기준 만료(1시간마다 연장), 쿠키 `HttpOnly; Secure; SameSite=Lax; Path=/`, 쿠키 세션이면 GET/HEAD가 아닌 요청에 CSRF 검사가 필요. → 세션 설계를 그대로 따른다. https://raw.githubusercontent.com/lucia-auth/lucia/refs/heads/main/code/auth_session.ts
- **Arctic(OAuth 클라이언트 라이브러리)**: 카카오 제공자가 있으나 2026년 7월 지원 종료(deprecated). 카카오 호출은 HTTP 3번이라 직접 구현한다(라이브러리 추가 안 함).
- **Web Share API(`navigator.share`)**: 휴대폰에서 OS 공유 시트(카카오톡 등)를 연다. 없는 브라우저는 [복사]만 보인다.

## 범위

- 포함:
  - 매물 하나 / 저장 목록 전체(최대 100개)를 공유 링크로 만들기(로그인 불필요), 링크 열어 내 목록에 사본으로 추가, 만든 직후 끊기, 30일 만료
  - 카카오 로그인(회원번호만), 세션 쿠키, 로그아웃
  - 로그인 상태의 저장 목록을 서버(D1)가 원본으로 관리: 조회·추가·수정(PUT 덮어쓰기, PATCH 메모)·삭제, 사용자당 500개 상한
  - 기기별 로그인 시 로컬 매물을 서버로 자동 이전(100개 단위, 로컬은 지우지 않음, id 기준 중복 없음)
- 범위 밖: (다음 단계 후보 참고)
  - 예산·작성 중 입력(draft)·실거래가 시군구 기억의 서버 동기화(기기별 로컬 유지)
  - 나중에 "보낸 링크" 목록에서 끊기, 받을 매물 골라 가져오기, 카카오톡 링크 미리보기(OG)
  - 오프라인 쓰기, 계정 삭제(탈퇴), 카카오 연결 해제 웹훅, 공동 편집 목록

## 기존 결정과의 관계

| ADR                 | 영향                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001 localStorage    | 뒤집을 조건("여러 기기 동기화") 충족. 로그인 안 한 사용자는 그대로 localStorage, 로그인 사용자는 서버가 원본(D3)                                                             |
| 004 해시 라우트 2개 | 뒤집을 조건("공유 링크(딥링크)") 충족. `#/share/{token}` 라우트 하나 추가(D2). 계산 화면이 draft만 보는 규칙은 그대로                                                        |
| 007 입력만 저장     | 유지. 공유 스냅샷·서버 저장 모두 입력값만, 화면은 현재 규제로 다시 계산                                                                                                      |
| 010 id 생성         | 뒤집을 조건("서버 동기화") 검토 결과 형식 그대로(16바이트 hex). 로컬 id를 서버 id로 그대로 써 이전 중복 판정에 쓴다. 서버 경계에서는 `^[A-Za-z0-9_-]{1,64}$`로 검증(ADR-023) |
| 012 저장 형식       | 뒤집을 조건("D1 스키마 버전") 해당. 서버도 같은 필드 규칙(키 없음 = 기본)을 JSON 본문으로 저장(D4)                                                                           |
| 011·014             | Worker 진입점 얇게, 로직은 `server/*`. 클라이언트 호출은 react-query 훅 + `apiClient`(post·put·patch·delete 추가, 204 비파싱), 자동 재시도 없음                              |
| 023 (이 기능)       | D1~D5 모두 A. 이 문서의 API 계약·태스크에 ADR-023 조건을 반영                                                                                                                |

## 데이터 모델

### D1 (`mortgage-fit`, 바인딩 `DB`)

migrations 위치: 프로젝트 루트 `migrations/` (wrangler 기본 `migrations_dir`). 적용: `pnpm wrangler d1 migrations apply mortgage-fit --local`(개발) / `--remote`(운영, 머지 전 리드가 실행). 이미 적용한 파일은 고치지 않는다.

`migrations/0001_shares.sql` (태스크 1)

```sql
CREATE TABLE shares (
  token          TEXT PRIMARY KEY,                 -- 16바이트 랜덤 base64url(22자)
  kind           TEXT NOT NULL CHECK (kind IN ('listing', 'list')),
  payload        TEXT NOT NULL,                    -- JSON 배열: ShareListing[] (1~100개)
  owner_key_hash TEXT NOT NULL,                    -- 끊기 키의 SHA-256 hex
  created_at     INTEGER NOT NULL,                 -- unix 초
  expires_at     INTEGER NOT NULL                  -- unix 초, created_at + 30일
);
CREATE INDEX shares_expires_at ON shares (expires_at);
```

`migrations/0002_accounts.sql` (태스크 2)

```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,                     -- 서버가 만든 16바이트 hex
  kakao_id   TEXT NOT NULL UNIQUE,                 -- 카카오 회원번호(Long)를 10진 문자열로
  created_at TEXT NOT NULL                         -- ISO 8601
);

CREATE TABLE sessions (
  id               TEXT PRIMARY KEY,               -- 토큰의 id 부분
  user_id          TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  secret_hash      TEXT NOT NULL,                  -- 토큰 secret의 SHA-256 hex
  created_at       INTEGER NOT NULL,               -- unix 초
  last_verified_at INTEGER NOT NULL                -- unix 초, 만료 판정 기준
);
CREATE INDEX sessions_user_id ON sessions (user_id);

CREATE TABLE listings (
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id         TEXT NOT NULL,                        -- 매물 id(로컬에서 옮긴 것은 로컬 id 그대로). ^[A-Za-z0-9_-]{1,64}$
  data       TEXT NOT NULL,                        -- JSON: ListingInput (아래)
  created_at TEXT NOT NULL,                        -- ISO 8601
  updated_at TEXT NOT NULL,                        -- ISO 8601
  PRIMARY KEY (user_id, id)
);
```

- 카카오 액세스·리프레시 토큰, 닉네임, 이메일은 저장하지 않는다(컬럼 없음).
- 인덱스: `listings`는 PK가 `(user_id, id)`라 사용자별 조회가 PK로 된다. 정렬은 클라이언트가 한다(ADR-007).
- 시각 컬럼이 shares·sessions는 unix 초, users·listings는 ISO 문자열로 섞여 있다. listings는 클라이언트 형식을 그대로 유지하려는 의도다.
- 사용자당 listings 최대 500행(ADR-023).

### 공통 타입 (계약 원본은 `src/lib/types/`, 서버는 type-only import — `aptTrade.ts`와 같은 방식)

```ts
// 매물 필드. 기존 src/lib/types/listing.ts의 ListingInput을 그대로 쓴다(같은 모양의 새 타입을 만들지 않음).
// 선택 필드 규칙은 ADR-012 그대로(키 없음 = 기본).
type ListingInput = {
  name: string; // 1~40자(코드포인트)
  salePrice: number; // 만원 정수 1~MAX_AMOUNT
  kbPrice: number;
  region: Region;
  borrower: Borrower;
  customLtvRate?: number; // 0~100 정수
  isAreaOver85?: true;
  memo?: string; // 1~500자 (서버·공유에서는 빈 문자열 불가, 키 없음 = 메모 없음)
};
type ShareListing = ListingInput; // 공유 스냅샷 한 항목
type ShareKind = "listing" | "list";
```

- **공유 검증 파일**: 매물 검증은 지금 `listingStorage.ts` 안(`isListing`, `isPrice`, `isLtvRate`, `isIsoDateString`)에 있다. 이를 새 파일 `src/lib/utils/validateListingFields.ts`로 꺼내 `validateListingFields`(필드), `isListingId`(`^[A-Za-z0-9_-]{1,64}$`), `isIsoDateString`(기존 규칙), `isListing`(id·시각 + 필드)을 export한다. 클라이언트 파서와 서버(`server/*`, 상대 경로 import)가 같은 함수를 쓴다. 검증 규칙의 원본은 한 곳.
- 이 파일과 그 전이 의존(`amount.ts`, `isOneOf.ts`, `validateListingMemo.ts`, `validateListingName.ts`, `constants/loanConditions.ts`와 그것이 type-import하는 `types/*`)은 **DOM 타입(`Storage` 등)과 `@/` 별칭이 없어야 한다**. 현재 `loanConditions.ts`가 `@/lib/types/loan`·`@/lib/types/regulation`을 import하므로 상대 경로로 바꾼다. 이유: `tsconfig.worker.json`은 `lib: ES2023`이고 `paths`가 없어, 그대로 두면 `tsc -b`(build)가 worker 프로젝트에서 TS2307로 실패한다(번들러는 type import를 지워 통과하므로 wrangler만으로는 못 잡는다). 검증 후 서버는 알려진 키만 골라 JSON을 만든다(알 수 없는 키 저장 안 함).
- `ApiError`는 지금 `src/lib/types/aptTrade.ts`에 있다. 오류 코드가 늘어나므로 `src/lib/types/api.ts`로 **옮기고**(`aptTrade.ts`에 재export를 두지 않는다) 모든 import를 고친다.

### 브라우저 저장소 (기존 키 접두사 `loan-calculator/` 유지)

| 키                                | 값                                                                                                                                                                                                                                                | 태스크 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `loan-calculator/listings`        | 기존 그대로. 로그인 안 한 상태의 원본. 로그인 중에는 읽기만 하고(이전용) 쓰지 않는다                                                                                                                                                              | —      |
| `loan-calculator/sent-shares`     | `[{ token, kind, ownerKey, expiresAt }]` 내가 만든 링크와 끊기 키. 다음 단계 "보낸 링크 목록"이 쓴다. 지금 버리면 이미 만든 링크를 영영 못 끊는다. 쓸 때마다 `expiresAt`이 지난 항목을 걸러 내 무한히 늘지 않게 하고, 끊기에 성공한 항목은 지운다 | 1      |
| `loan-calculator/account-imports` | `{ [userId]: string[] }` 이 기기에서 그 계정으로 옮긴(또는 옮기지 않기로 한) 매물 id 목록                                                                                                                                                         | 3      |

- `loan-calculator/session-hint` (태스크 2 추가): `/api/me`가 사용자를 돌려줬을 때만 기록, `{user:null}`·로그아웃·401에 지움. `/api/me` 실패 시 이 키가 있으면 `error`(쓰기 막음), 없으면 `loggedOut`(로컬).

## API 계약

### 공통

- 모든 응답은 JSON(`Content-Type: application/json; charset=utf-8`), 오류 본문은 기존 형식 `{ "error": code, "message": string }`, 오류 응답은 `Cache-Control: no-store`. 목록·세션 응답도 `no-store`. 성공 204는 본문 없음.
- **미등록 경로**: 이 문서 표에 없는 `/api/*` 경로는 `ASSETS`(SPA index.html)로 넘기지 않고 JSON 404 `notFound`. 경로는 있는데 메서드가 틀리면 405 `methodNotAllowed`(+`Allow` 헤더).
- **CSRF**: GET/HEAD가 아닌 모든 `/api/*` 요청은 `Origin` 헤더가 요청 URL의 origin과 같아야 한다. 없거나 다르면 `403 forbidden`. 세션 쿠키 `SameSite=Lax`와 함께 쓴다.
- **인증**: 세션 쿠키 `mf_session`(값 `{sessionId}.{secret}`, `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`). 클라이언트 fetch는 같은 출처라 기본값으로 쿠키가 실린다. 인증이 필요한 엔드포인트에서 쿠키가 없거나 형식이 틀리거나 무효·만료면 `401 unauthorized`.
- 세션 검증: id로 행을 찾고 SHA-256(secret)을 상수 시간 비교(`crypto.subtle.timingSafeEqual`) → `now - last_verified_at >= 30일`이면 만료(행 삭제 후 401) → 1시간 이상 지났으면 `last_verified_at = now`로 갱신하고 쿠키를 다시 내려 만료를 연장(인증을 거치는 모든 응답에서 한 곳에서 처리, `/api/me` 포함).
- **본문 한도**: 바이트를 스트림으로 읽으며 센다(`Content-Length`만 믿지 않음, chunked 요청 포함). 초과 시 `413 payloadTooLarge`. `POST /api/shares`는 128KB, 그 밖의 쓰기 요청은 512KB.
- **id·시각 검증**: 매물 `id`(본문과 경로 `{id}` 모두)는 `^[A-Za-z0-9_-]{1,64}$`, `createdAt`·`updatedAt`은 기존 `isIsoDateString` 규칙. 위반은 `400 invalidParams`.
- 예상 못 한 예외는 `500 internal`. 로그에 세션 토큰·카카오 토큰·인가 코드·회원번호를 남기지 않는다.

오류 코드(추가분 굵게): `invalidParams`(400, 본문 검증 실패 포함) · **`unauthorized`(401)** · **`forbidden`(403)** · **`notFound`(404)** · `methodNotAllowed`(405) · **`shareGone`(410)** · **`payloadTooLarge`(413)** · `notConfigured`(503) · `internal`(500)

### 태스크 1 — 공유

| Method | Path                  | 인증                     | Request                              | Response                                                       | 에러                                                                                                      |
| ------ | --------------------- | ------------------------ | ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| POST   | `/api/shares`         | 없음                     | `{ kind, listings: ShareListing[] }` | 201 `{ token, url, expiresAt, ownerKey }`                      | 400 invalidParams(kind 아님, 배열 0개·101개 이상, 필드 검증 실패), 403 forbidden(Origin), 413(128KB 초과) |
| GET    | `/api/shares/{token}` | 없음                     | —                                    | 200 `{ kind, listings: ShareListing[], createdAt, expiresAt }` | 404 notFound(없음·끊김·정리됨), 410 shareGone(만료, 아직 정리 전)                                         |
| DELETE | `/api/shares/{token}` | `X-Share-Owner-Key` 헤더 | —                                    | 204                                                            | 403 forbidden(키 불일치·Origin), 404 notFound                                                             |

- `kind: "listing"`이면 `listings`는 정확히 1개여야 한다(아니면 400). `kind: "list"`는 1~100개.
- 토큰: 16바이트 랜덤 base64url(22자). `ownerKey`: 32바이트 랜덤 base64url, DB엔 SHA-256 hex만. `url`은 요청 origin으로 만든 `{origin}/#/share/{token}`.
- 끊기는 행을 지운다(이후 GET은 404).
- **만료 정리**: GET은 행을 지우지 않는다. 만료 행은 정리되기 전까지 일관되게 410, 정리된 뒤에는 404다. 정리는 `POST /api/shares`가 올 때마다 `DELETE FROM shares WHERE expires_at < now`로 한다(크론 없음). **클라이언트는 410·404를 모두 "사라진 링크"로 보고 같은 화면을 보인다.**
- GET 성공 응답은 `Cache-Control: no-store`(끊은 링크가 캐시로 열리지 않게).
- 익명 생성은 curl로도 가능해 Origin 검사가 저장 공간 소진을 막지 못한다. 위험을 줄이려 100개·128KB 상한을 두고, 호출 제한(Rate limiting)은 다음 단계 후보로 둔다.

요청·응답 예시

```http
POST /api/shares
Origin: https://loan.conychoi.dev
Content-Type: application/json

{ "kind": "listing",
  "listings": [{ "name": "래미안OO 101동", "salePrice": 125000, "kbPrice": 120000,
                 "region": "regulated", "borrower": "noHome", "customLtvRate": 70 }] }
```

```json
201
{ "token": "q3Jx7cVb0yP1mLk9sT2wAa",
  "url": "https://loan.conychoi.dev/#/share/q3Jx7cVb0yP1mLk9sT2wAa",
  "expiresAt": "2026-11-22T03:00:00.000Z",
  "ownerKey": "J4p...(43자)" }
```

```json
GET /api/shares/q3Jx7cVb0yP1mLk9sT2wAa → 200
{ "kind": "listing",
  "listings": [{ "name": "래미안OO 101동", "salePrice": 125000, "kbPrice": 120000,
                 "region": "regulated", "borrower": "noHome", "customLtvRate": 70 }],
  "createdAt": "2026-10-23T03:00:00.000Z", "expiresAt": "2026-11-22T03:00:00.000Z" }

→ 410 { "error": "shareGone", "message": "만료된 공유 링크입니다" }
```

### 태스크 2 — 인증·계정·목록

| Method | Path                       | 인증            | Request                                                                                | Response                                                       | 에러                                                                                                                          |
| ------ | -------------------------- | --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/auth/kakao/login`    | 없음            | —                                                                                      | 302 → 카카오 인가 URL, `Set-Cookie: mf_oauth_state`            | 키 미설정이면 302 → `/#/listings?login=notConfigured`                                                                         |
| GET    | `/api/auth/kakao/callback` | state 쿠키      | `?code&state` 또는 `?error&error_description&state`                                    | 302 → `/#/listings`, `Set-Cookie: mf_session`, state 쿠키 삭제 | 302 → `/#/listings?login=cancelled`(error=access_denied) / `login=failed`(state 불일치, 토큰·사용자 정보 실패, 회원번호 이상) |
| POST   | `/api/auth/logout`         | 쿠키(없어도 됨) | —                                                                                      | 204, 세션 행 삭제, `mf_session` 만료 쿠키                      | 403 forbidden(Origin)                                                                                                         |
| GET    | `/api/me`                  | 쿠키(선택)      | —                                                                                      | 200 `{ "user": { "id": "…" } }` 또는 200 `{ "user": null }`    | —                                                                                                                             |
| GET    | `/api/listings`            | 필수            | —                                                                                      | 200 `{ listings: Listing[] }`                                  | 401                                                                                                                           |
| POST   | `/api/listings`            | 필수            | `{ listing: ListingInput }`                                                            | 201 `{ listing: Listing }` (id·시각은 서버가)                  | 400(필드 검증, **501번째**), 401                                                                                              |
| PUT    | `/api/listings/{id}`       | 필수            | `{ listing: ListingInput }` — **`memo` 키는 읽지 않는다(있어도 무시, 기존 메모 유지)** | 200 `{ listing: Listing }`                                     | 400, 401, 404 notFound(다른 기기에서 삭제)                                                                                    |
| PATCH  | `/api/listings/{id}`       | 필수            | `{ memo: string }` (`""` = 메모 지움, 1~500자)                                         | 200 `{ listing: Listing }`                                     | 400, 401, 404                                                                                                                 |
| DELETE | `/api/listings/{id}`       | 필수            | —                                                                                      | 204                                                            | 400(id 형식), 401, 404                                                                                                        |
| POST   | `/api/listings/import`     | 필수            | `{ listings: Listing[] }` 1~**100**개 (id·createdAt·updatedAt 포함)                    | 200 `{ imported: number, skipped: number }`                    | 400(101개 이상, id·시각·필드 검증, **상한 초과**), 401, 413                                                                   |

- `/api/me`는 로그인 안 했을 때 401 대신 200 `{user:null}`(앱 시작마다 콘솔 오류를 만들지 않으려고). `user.id`는 내부 id이고 카카오 회원번호는 내보내지 않는다.
- POST/PUT/PATCH는 `updated_at`을 **서버 시각**으로 쓴다(기기 시계 차이로 순서가 뒤집히지 않게). PUT·PATCH는 `created_at`을 유지한다. 메모만 고쳐도 `updated_at`은 갱신된다(로컬 스토어와 같은 규칙).
- **PUT은 한 문장 UPDATE**다. SELECT 후 UPDATE를 하지 않는다. 본문에서 `memo`를 뺀 필드로 `data`를 만들되 기존 `memo`는 그대로 보존한다(예: `json_set`/`CASE`로). 영향 행이 0이면 404. **PATCH도 한 문장 UPDATE**로 `memo` 키만 `json_set`/`json_remove`한다(다른 기기가 바꾼 가격 필드를 되돌리지 않는다). 그래서 계산 화면 덮어쓰기(PUT)는 다른 기기의 메모를, 메모 편집(PATCH)은 다른 기기의 가격 등을 건드리지 않는다.
- **사용자당 500개 상한**: POST로 501번째, 또는 import로 "새로 들어갈 수(요청 중 아직 없는 id)"를 더해 500을 넘기면 400 `invalidParams`(아무것도 넣지 않음, message에 500개 한도 안내). 이미 옮긴 id를 다시 보내는 재시도는 새로 들어갈 수에 세지 않아 막히지 않는다. 경합으로 약간 넘는 것은 허용 가능하다(인증 뒤라 위험 낮음).
- **import**: 클라이언트가 100개 단위로 나눠 보낸다. 서버는 한 요청을 `INSERT … SELECT … FROM json_each(?) … ON CONFLICT (user_id, id) DO NOTHING` 한 문장(또는 소량 다중 행 배치)으로 넣어, Workers 호출당 D1 쿼리 수 한도와 바인딩 수 한도(둘 다 구현 때 `--local`과 문서로 확인, 로컬 `wrangler dev`는 한도를 재현하지 않는다)를 피한다. `imported`는 `meta.changes` 합, `skipped = 보낸 수 - imported`. 같은 요청에 id가 중복이면 뒤의 것은 `skipped`. 넘어온 `createdAt`·`updatedAt`을 그대로 쓴다. 공유받기(로그인 상태)도 이 엔드포인트를 쓴다(클라이언트가 새 id·현재 시각을 붙여 보냄).
- 응답의 `Listing`은 기존 클라이언트 타입 그대로(`{ id, ...ListingInput, createdAt, updatedAt }`).
- 클라이언트 `apiClient`는 `post`·`put`·`patch`·`delete`를 추가하고, **204 응답은 본문을 파싱하지 않는다**(공유 끊기·매물 삭제·로그아웃).

### 카카오 로그인 흐름 (공식 문서 확인분)

1. `GET /api/auth/kakao/login`
   - `state` = 32바이트 랜덤 base64url. 쿠키 `mf_oauth_state={state}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/kakao; Max-Age=600`.
   - 302 → `https://kauth.kakao.com/oauth/authorize?client_id={KAKAO_REST_API_KEY}&redirect_uri={origin}/api/auth/kakao/callback&response_type=code&state={state}`
   - `scope`는 보내지 않는다(동의항목 없음, 회원번호만). `prompt`·`nonce`(OpenID Connect)도 쓰지 않는다.
2. 카카오가 `redirect_uri`로 302: 성공 `?code=…&state=…`, 사용자가 취소하면 `?error=access_denied&error_description=User%20denied%20access&state=…`.
   - 서버는 쿼리 `state`와 쿠키 값이 같은지 먼저 본다(문서: 요청마다 고유한 state를 만들고 응답과 비교). 콜백을 새로고침하면 state 쿠키가 이미 지워져 `login=failed`가 보이면서 실제로는 로그인된 상태일 수 있다(표시만 어색, 데이터 문제 없음).
3. 토큰 받기: `POST https://kauth.kakao.com/oauth/token`, `Content-Type: application/x-www-form-urlencoded;charset=utf-8`, 본문 `grant_type=authorization_code`, `client_id`, `redirect_uri`(1과 같은 값), `code`, `client_secret`.
   - 문서: REST API 키는 클라이언트 시크릿이 기본으로 켜져 있어 토큰 요청에 `client_secret`이 필요하다.
   - 응답 필드: `token_type`("bearer"), `access_token`, `expires_in`, `refresh_token`, `refresh_token_expires_in`, `scope`(, OIDC일 때 `id_token`). 우리는 `access_token`만 한 번 쓰고 버린다.
4. 사용자 정보: `GET https://kapi.kakao.com/v2/user/me`, 헤더 `Authorization: Bearer {access_token}`.
   - 응답 필드: `id`(Long, 회원번호, 필수), `connected_at`, `synched_at`, `has_signed_up`, `properties`, `kakao_account`, `for_partner` 등. 우리는 `id`만 읽는다.
   - `id`가 `Number.isSafeInteger`가 아니면 실패(`login=failed`)로 처리한다(JSON 숫자 정밀도 손실 방지).
5. `users`에 `kakao_id`로 `INSERT … ON CONFLICT(kakao_id) DO NOTHING` 후 `SELECT id`(`DO UPDATE`로 id를 덮어쓰면 기존 listings가 끊긴다) → 같은 사용자의 만료 세션 정리 → 세션 생성 → `Set-Cookie: mf_session` → 302 `/#/listings`.

- 각 카카오 호출은 `AbortSignal.timeout(10_000)`. 실패는 카카오 오류 코드(예: 토큰 발급 한도 초과 `KOE237`)만 로그에 남긴다.
- 로그아웃은 우리 세션만 지운다. 카카오 로그아웃(`POST https://kapi.kakao.com/v1/user/logout`)·연결 끊기(`/v1/user/unlink`)·카카오계정과 함께 로그아웃(`GET https://kauth.kakao.com/oauth/logout`)은 호출하지 않는다. 문서상 서비스 로그아웃 때 이것을 꼭 불러야 한다는 요구는 없다. 토큰을 저장하지 않으므로 부를 수도 없다.
- 시크릿: `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` — Worker **Runtime** Secret(빌드 변수 칸 아님, 지난번 `MOLIT_SERVICE_KEY` 교훈), 로컬은 `.dev.vars`. 둘 중 하나라도 비면 1단계에서 `login=notConfigured`. `Env`에 `DB: D1Database`와 시크릿 둘(optional)을 추가한다.
- 카카오 앱 설정(사용자 작업): [카카오 로그인] > 사용 설정 ON(꺼져 있으면 KOE004), Redirect URI 등록(틀리면 KOE006), 동의항목은 설정하지 않음, [앱] > [플랫폼 키] > [REST API 키] > 클라이언트 시크릿 확인.
- **미확인**: 인가 코드 유효 시간과 1회용 여부(문서에 없음), 회원번호 최대 자릿수(안전 정수 범위인지), 동의항목 0개일 때 실제 동의 화면(문서는 "앱과 사용자의 연결만 표시"라고 함, 실제 화면은 키를 받은 뒤 확인), Redirect URI 개수 제한과 일치 규칙(로그인 Redirect URI 쪽 문서에서 못 찾음), PR 미리보기 주소에서의 로그인(미리보기 주소가 등록 안 돼 있으면 KOE006 — 미리보기에선 로그인 확인 안 함).

## 화면

### 저장 목록 `#/listings` (변경)

- **계정 줄**(머리글 아래 한 줄). 출처 상태 4값(`loading | loggedOut | loggedIn | error`, 아래 "동기화 규칙")에 따른다.
  - `loading`(`/api/me` 응답 전, 또는 로그인 직후 이전이 끝나기 전): 계정 줄과 목록 자리에 로딩 표시. 로컬 목록을 먼저 그렸다가 서버 목록으로 바꾸지 않는다(깜빡임 방지).
  - `loggedOut`: "이 기기에만 저장됩니다 · [카카오로 로그인]" (`/api/auth/kakao/login`으로 이동하는 링크. 버튼 모양은 카카오 로그인 디자인 가이드를 fe가 확인해 따른다).
  - `loggedIn`: "카카오 계정에 저장 중 · [로그아웃]" + 보조 문구 "로그아웃하면 이 기기에 있던 목록으로 돌아갑니다". 누구의 계정인지는 표시하지 않는다(회원번호만 저장). 한 PC를 둘이 쓰면 구분이 안 되는 점은 감수한다.
  - `error`(`/api/me` 네트워크·500): "계정 상태를 확인하지 못했습니다 [다시 시도]". 이 상태에서는 목록 쓰기를 막고 로컬로 몰래 폴백하지 않는다.
  - `?login=cancelled|failed|notConfigured`로 돌아오면 줄 아래에 안내 한 줄("로그인을 취소했습니다" / "로그인하지 못했습니다. 다시 시도해 주세요" / "로그인을 준비 중입니다")을 보이고 주소에서 `login`을 replace로 지운다(새로고침해도 다시 안 뜨게). **`login`은 `Route`의 listings에 `login?: "cancelled" | "failed" | "notConfigured"`로 넣어** `useHashRoute`의 정규화(`toRoutePath`와 다른 해시를 즉시 replace)가 먼저 지우지 않게 한다. 계정 줄이 값을 `useState`로 한 번 잡은 뒤 replace로 지운다. 허용 목록(`isOneOf`) 밖의 값은 버린다. 로그인 후에는 항상 `/#/listings`(기본 정렬·보기)로 돌아온다.
  - "n개를 내 목록에 추가했습니다"·"이 기기의 매물 n개를 계정으로 옮겼습니다" 알림은 URL이 아니라 `AppRoutes`의 메모리 상태로 넘긴다(지금 `suggestedName`과 같은 방식).
- **[목록 공유]** 머리글 오른쪽. 매물 0개, 목록 손상·접근 불가면 숨김. 101개 이상이면 시트에서 링크 만들기 대신 "한 번에 100개까지 공유할 수 있습니다"를 보인다.
- **카드 [공유]** 기존 수정·복사·삭제 줄에 추가(간단히 보기의 펼친 카드도 같은 카드라 같이 생김). 버튼이 4개가 되므로 360px에서 줄이 깨지지 않는지 실기 확인(AC-13).
- 로그인 상태 로딩·오류: 목록 조회 실패는 **받아 둔 목록이 없을 때만** "목록을 불러오지 못했습니다 [다시 시도]" 전체 오류 화면이다. 창 포커스 재조회가 실패했는데 이미 받은 목록이 있으면 목록을 지우지 않고 작은 경고 한 줄만 보인다. 창으로 돌아오면(포커스) 다시 조회해 다른 기기 변경을 반영한다. 재조회로 목록 객체가 교체돼도 `MemoEditor`가 입력 중인 문자열을 유지한다(초기값이 `listing.memo` 변화에 덮이지 않게).
- 쓰기 실패: 삭제·메모 실패는 지금처럼 목록 위 `role=alert` 한 줄. 사유별 문구는 기존처럼 `Record<reason, string>`으로 두어 새 사유(`unauthorized`, `network`, `limit` 등)를 타입 검사가 강제하게 한다(`switch`를 늘리지 않는다). 404(다른 기기에서 이미 삭제)는 "다른 기기에서 삭제된 매물입니다"로 알리고 목록을 다시 조회. 401은 "로그인이 끝났습니다. 다시 로그인해 주세요"와 함께 로그아웃 상태로 바뀐다(입력 중이던 메모 문자열은 지우지 않는다). 500개 상한 400은 "계정에는 매물을 500개까지 저장할 수 있습니다".
- **이전 중·후(태스크 3)**: 이전이 끝나거나 건너뛰기로 정해질 때까지 목록은 로딩이다("저장한 매물이 없습니다"를 먼저 보이지 않는다). 끝나면 "이 기기의 매물 n개를 계정으로 옮겼습니다"를 목록 위에 한 번. 일부라도 실패하면 "이 기기의 매물 n개를 옮기지 못했습니다 [다시 시도]". 손상된 로컬 목록이면 "이 기기의 저장 목록이 손상되어 계정으로 옮기지 못했습니다"(로컬 원문은 로그아웃하면 기존 손상 안내·원문 복사로 볼 수 있음).

### 공유 시트 (새, 저장 목록에서 엶)

- 제목: 매물 공유면 "'{이름}' 공유", 목록 공유면 "저장 목록 공유 (n개)".
- [메모 함께 보내기] 체크(기본 꺼짐, 메모 있는 매물이 하나도 없으면 숨김) → [링크 만들기].
- 만드는 중: 버튼 비활성 + "링크를 만드는 중". 실패: "링크를 만들지 못했습니다 [다시 시도]".
- 성공: 링크 문자열(읽기 전용 입력칸, 선택 가능해 직접 복사할 수 있게 포커스 시 전체 선택) + [복사](`navigator.clipboard`가 있을 때만, 성공 시 "복사했습니다") + [공유하기](`navigator.share`가 있을 때만) + 안내 "30일 동안 열 수 있습니다. 받은 사람 목록에 복사본으로 들어가며, 이후 내가 고쳐도 바뀌지 않습니다." + [이 링크 끊기](확인창 후 DELETE).
- **끊은 뒤**: 링크 입력칸·[복사]·[공유하기]·[이 링크 끊기]를 모두 없애고 "링크를 끊었습니다. 이 링크는 더 이상 열리지 않습니다"와 [닫기]만 남긴다(끊긴 링크를 복사해 보내지 않게). `sent-shares`에서 그 항목을 지운다.
- 시트를 닫았다 다시 열면 새로 만들기 상태다(나중에 끊기 = 다음 단계).
- 기존 시트 규칙 그대로: Esc 닫기, 뒤 화면 inert, 닫으면 포커스 복귀. 이를 Listings에서도 쓰도록 `Sheet`(+css)와 `useOpenSheet`를 전역으로 승격한다(태스크 1-5).

### 공유받기 `#/share/{token}` (새 라우트)

- 진입: 공유 링크. 탭 내비게이션은 보이되 어느 탭도 선택 표시 안 함. 라우트는 `{ name: "share", token }`이고 토큰은 대소문자를 그대로 둔다(정규화로 소문자화 금지). 모양이 틀린 토큰도 라우트는 만들고(`parseRoute`가 계산 화면으로 돌리지 않는다) 화면이 모양을 검사한다.
- 로딩: "공유받은 매물을 불러오는 중". `useShare`는 `staleTime: 0`(끊은 링크가 탭 캐시로 열리지 않게; 전역 staleTime은 10분).
- 성공: 제목 "공유받은 매물 n개"(목록 공유는 "공유받은 저장 목록 (n개)"), 설명 "내 목록에 복사본으로 추가됩니다. 보낸 사람이 나중에 고쳐도 내 목록은 바뀌지 않아요." / 매물마다 이름·매매가·KB시세·필요한 자기자금(현재 규제로 다시 계산) / 규제 기준일 표시(CLAUDE.md) / [내 목록에 추가 (n개)] / [취소](계산 화면으로).
  - **응답 재검증**: GET 응답은 클라이언트에서 같은 공유 검증 함수로 다시 검증한 뒤에만 보이고 추가한다(항목 하나가 어긋난 채 로컬에 들어가면 받는 사람의 목록 전체가 손상 상태가 되기 때문, ADR-001). 실패하면 404 화면이 아니라 "불러오지 못했습니다" 화면. 로컬 스토어 일괄 추가(`addMany`)도 알려진 필드만 통과시킨다(`toListingFields`).
  - 추가 대상: `loggedOut`이면 로컬 목록, `loggedIn`이면 서버 목록(`/api/listings/import`). **[내 목록에 추가]는 출처가 `loggedOut | loggedIn`으로 정해진 뒤에만 활성**이다(`loading`·`error`면 비활성 + 이유 한 줄). 안 그러면 로그인한 사람의 사본이 로컬로 간다. 새 id, `createdAt`·`updatedAt` = 지금, 이름 그대로.
  - 누르는 동안 버튼 비활성(두 번 눌러 두 벌 들어가지 않게). 성공하면 `#/listings`로 **replace**(뒤로 가기로 공유 화면에 돌아와 또 추가하지 않게) + 알림 "n개를 내 목록에 추가했습니다".
  - `loggedOut`일 때 [내 목록에 추가] 아래에 **카카오톡 인앱 브라우저 안내**: "이 브라우저에만 저장됩니다. 카카오톡 안에서 열었다면 다른 브라우저에서는 보이지 않을 수 있어요. 여러 기기에서 보려면 [카카오로 로그인]". 로그인 후 돌아오는 곳은 `#/listings`라 공유 화면에서의 추가는 로그인 전에 끝내도 이전으로 넘어간다.
  - 로컬 목록이 손상·접근 불가면 버튼 비활성 + 이유(기존 문구 재사용). 서버 상한 400이면 "계정에는 매물을 500개까지 저장할 수 있습니다".
- 404·410(둘 다 같은 화면): "만료되었거나 끊긴 링크입니다" + [계산기로 가기]. 네트워크·500: "불러오지 못했습니다 [다시 시도]".
- 잘못된 토큰 모양(22자 base64url 아님): 요청하지 않고 404와 같은 화면.
- 매물 미리보기에는 저장 목록 카드 전체 대신 이름·가격·자기자금 한 줄만 재사용하는 쪽이 작으면 그렇게 한다. 카드를 재사용하면 컨테이너 간 import 금지 규칙에 따라 `components/`로 승격한다(fe 판단). `TabNav`는 `current`를 탭 이름으로 좁혀 `null`이면 선택 없음으로 처리하고, 탭 레지스트리는 유지한다.

### 계산 화면 `#/` (변경)

- 저장·덮어쓰기는 비동기가 된다. 저장 중 버튼 비활성, 실패하면 시트를 닫지 않고 입력·이름을 그대로 둔 채 이유를 보인다("저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요"). 덮어쓰기 대상이 다른 기기에서 삭제됐으면(404) "다른 기기에서 삭제된 매물입니다"와 [새로 저장]을 보인다.
- 출처 상태가 `loading`·`error`이면 저장 버튼 비활성 + 이유 한 줄(로그인 사용자가 서버 매물을 연 채 새로고침했을 때 편집 배너 없이 복제본이 생기는 것을 막는다). 계산 화면도 로그인 사용자라면 서버 목록 조회가 필요하므로 `/api/me`를 기다린다.
- 성공 후 동작(새 계산 리셋 + 알림)은 지금과 같다. 단, 저장 중에 입력이 바뀌었으면(제출 시점 draft와 다름) 리셋하지 않고 알림만 보인다(고친 입력이 지워지지 않게).

## 동기화 규칙

- **원본**: 로그인 상태에선 서버, 로그아웃 상태에선 localStorage. 두 원본을 동시에 섞어 보여 주지 않는다.
- **출처 상태 4값** (`loading | loggedOut | loggedIn | error`, 저장 목록·계산 화면·공유받기가 같은 `useListingSource`(가칭)를 쓴다):

  | 상태      | 뜻                                               | 쓰기                                                 | 목록      |
  | --------- | ------------------------------------------------ | ---------------------------------------------------- | --------- |
  | loading   | `/api/me` 응답 전, 또는 로그인 직후 이전 진행 중 | 기다린다(버튼 비활성)                                | 로딩      |
  | loggedOut | `{user:null}`                                    | 로컬 스토어                                          | 로컬 목록 |
  | loggedIn  | 사용자 있음, 이전 끝남                           | 서버 훅                                              | 서버 목록 |
  | error     | `/api/me` 실패                                   | 막는다(안내 + [다시 시도]), **로컬로 폴백하지 않음** | 안내      |

  로그아웃·401 때는 목록 캐시를 `removeQueries`로 지운다(공용 PC에서 같은 탭의 다음 계정에 이전 목록이 보이지 않게; 로그아웃은 SPA 안이라 캐시가 자동 초기화되지 않는다).

- **충돌(제안 기본값, U4)**: 매물 단위 "마지막 저장이 이김". 서버는 받은 순서대로 덮어쓴다. 필드 덮어쓰기(PUT)는 메모를 건드리지 않고, 메모 편집(PATCH)은 메모만 바꾼다. 따라서 계산 화면 덮어쓰기가 다른 기기에서 쓴 메모를 지우지 않고, 오래된 화면에서 메모를 고쳐도 다른 기기에서 바꾼 매매가를 되돌리지 않는다. 다른 기기에서 삭제된 매물을 수정하면 404 → 안내 + [새로 저장].
- **최신화**: 목록 조회는 창 포커스·화면 진입 때 다시 한다(react-query `refetchOnWindowFocus`, 이 쿼리는 `staleTime: 0`). 실시간 푸시는 없다. 목록 쿼리 키는 `listingListQueryKey` = `["listing","list"]`이고 변경 훅의 `onSuccess`가 이 키를 무효화한다.
- **로그아웃(제안 기본값, U1)**: 세션 삭제 → 로컬 목록(로그인 전부터 이 기기에 있던 것)으로 돌아간다. 서버 목록 사본을 이 기기에 남기지 않는다(공용 기기에서 남의 목록이 남지 않게). draft의 `listingId`가 서버 매물을 가리키면 로컬 목록에 없으므로 기존 규칙대로 새 매물로 취급된다. 이미 옮긴 매물을 로그아웃 상태에서 고치면 서버에 반영되지 않고 서버에서 고친 것은 이 기기에 없다(같은 id의 두 버전이 갈라짐). 이번 범위에서는 기본값을 유지하고 계정 줄 문구로 기대를 설정한다.
- **이전(태스크 3, 제안 기본값 U6)**: 로그인 확인 직후 한 번, 로컬 목록이 정상이면 `account-imports[userId]`에 없는 id만 **100개 단위로** `/api/listings/import`로 보낸다(배치마다 성공하면 그 id를 마커에 추가) → 목록 다시 조회 → `imported` 합이 0보다 크면 알림. 이전이 끝나거나 건너뛰기로 정해질 때까지 목록 쿼리는 시작하지 않는다(`enabled`). 그래서
  - 기기별 첫 로그인: 로컬 전부를 옮김.
  - 같은 기기 재로그인: 이미 옮긴 것은 안 보냄. 로그아웃 상태에서 새로 저장한 매물만 옮김.
  - 서버에서 지운 매물은 같은 기기에서 다시 로그인해도 되살아나지 않음(마커에 있음).
  - 두 탭이 동시에 보내도, 마커 기록 전에 실패해 다시 보내도 서버가 `(user_id, id)` 충돌을 건너뛰어 중복이 없다. 실행 중 재진입은 막는다.
  - 다른 기기의 로컬 매물은 id가 달라 모두 합쳐진다(내용이 같아도 둘 다 남음).
  - 로컬은 지우지 않는다.
  - **다른 계정 기록이 있으면 한 번 묻는다**: `account-imports`에 다른 userId 키가 이미 있고 이 userId의 키는 아직 없으면(= 이 계정의 첫 이전) 옮기기 전에 `window.confirm("이 기기의 매물 n개를 내 계정으로 옮길까요?")`. 확인하면 옮긴다. 취소하면 보내려던 id를 이 계정의 마커에 넣어 영구 제외하고(다시 묻지 않음) 옮기지 않는다. 단일 사용자 기기는 묻지 않고 자동으로 옮긴다.
  - 실패(네트워크·400·413)하면 마커를 갱신하지 않아 다음 로드에 다시 시도하고, 사용자에게는 "옮기지 못했습니다 [다시 시도]"를 보인다.

## 수용 기준

> 테스트 코드는 새로 쓰지 않는다(사용자 지시, qa off). 단, **바뀐 구조로 깨지는 기존 테스트는 고쳐서 `pnpm test`를 통과시킨다**(`pnpm lint`·`pnpm format:check`·`pnpm build`도 통과). 깨지는 테스트는 그 파일의 소유자가 고친다(파일 소유 참고). 리드가 화면(360×780)·`curl`·`wrangler d1 execute`로 확인한다. curl의 쓰기 요청에는 `-H 'Origin: <같은 origin>'`을 붙인다.
> 사용자가 범위(3태스크)를 정해 수용 기준이 기본 상한(8)을 넘는다.

### 최우선 — 기존 사용자 데이터 보존 (사용자 요청, 모든 태스크 공통)

- [ ] AC-0 (배포 후 기존 데이터 유지): 이 기능을 배포하기 전 버전에서 매물·메모·예산·작성 중 입력을 저장해 둔 브라우저로 새 버전을 열면, **로그인하지 않아도** 저장 목록·메모·예산·작성 중 입력이 전과 똑같이 보인다. 로그인하면 그 목록이 계정으로 옮겨져 보이고, 로그아웃하면 다시 로컬 목록이 그대로 보인다. 어떤 경우에도 기존 localStorage 키(`loan-calculator/listings`, `budget`, `draft`, `trade-lookup`)의 이름·형식을 바꾸거나 지우거나 다시 쓰지 않는다(새 키 추가만 허용). 저장 형식 회귀 테스트(`ListingCard.test.tsx`의 1차 형식 원문)는 계속 통과해야 한다. 확인: 배포 전 main 빌드로 데이터를 넣은 브라우저 프로필에서 새 빌드를 열어 비교.

### 태스크 1 — 공유 링크

- [ ] AC-1 (매물 공유 만들기): 저장 목록 카드 [공유] → [링크 만들기] → `{origin}/#/share/{22자}` 링크가 보이고 [복사] 후 "복사했습니다". `curl {origin}/api/shares/{token}` → 200, `kind:"listing"`, `listings` 1개, 메모 체크를 안 했으면 `memo` 키 없음, `expiresAt` = 만든 시각 + 30일. 메모 체크 후 만든 링크는 `memo`가 들어 있다.
- [ ] AC-2 (받기·사본): 다른 브라우저 프로필(저장 목록 비어 있음)에서 [목록 공유]로 만든 n개짜리 링크를 열면 "공유받은 저장 목록 (n개)", 매물별 필요한 자기자금, 규제 기준일이 보인다 → [내 목록에 추가 (n개)] → 주소가 `#/listings`(뒤로 가기로 공유 화면에 안 돌아감), n개 추가, 알림 "n개를 내 목록에 추가했습니다". 보낸 쪽에서 원본 매물을 고치거나 지워도 받은 쪽 목록은 그대로이고, 받은 매물의 id는 원본과 다르다. 로그아웃 상태에서는 [내 목록에 추가] 아래에 "이 브라우저에만 저장됩니다…" 안내가 보인다.
- [ ] AC-3 (끊기·만료·없음): 시트 [이 링크 끊기] 후 시트에 링크·[복사]·[공유하기]가 사라지고 "링크를 끊었습니다"와 [닫기]만 남으며, 그 링크를 열면 "만료되었거나 끊긴 링크입니다"(API 404). `wrangler d1 execute`로 `expires_at`을 과거로 바꾼 링크는 같은 화면(정리 전 API 410 `shareGone`, GET만으로는 행이 지워지지 않아 같은 요청을 반복해도 계속 410). 이후 아무 `POST /api/shares`를 하면 그 행이 사라지고 같은 링크는 API 404이며 화면은 그대로 같다. 없는 토큰·모양이 틀린 토큰도 같은 화면. `X-Share-Owner-Key`가 틀린 DELETE는 403. 끊기 성공 뒤 `loan-calculator/sent-shares`에서 그 항목이 사라진다.
- [ ] AC-4 (서버 검증): POST `/api/shares`에 이름 41자, `region:"seoul"`, `customLtvRate:70.5`, 빈 배열, 101개, `kind:"listing"`에 2개 → 각각 400 `invalidParams`. 129KB 본문(Content-Length 있음, 그리고 `Transfer-Encoding: chunked`) → 413. 100개·128KB 이하는 201. `Origin`이 다르거나 없는 POST → 403. D1 `shares` 행의 `owner_key_hash`는 응답 `ownerKey`와 다른 값(해시)이다.
- [ ] AC-5 (라우팅): `GET /api/nope` → 404 JSON `{"error":"notFound",…}`(HTML이 아님). `GET /api/shares`(토큰 없음)·`PUT /api/shares/{token}` 같은 메서드 불일치 → 405 `methodNotAllowed` + `Allow` 헤더. 모든 오류 응답에 `Cache-Control: no-store`.

### 태스크 2 — 카카오 로그인 + 서버 저장

- [ ] AC-6 (키 없음): 시크릿이 없는 환경에서 [카카오로 로그인] → `#/listings`로 돌아와 "로그인을 준비 중입니다", 주소에 `login`이 남지 않는다(새로고침해도 안내가 다시 안 뜬다). `curl {origin}/api/me` → 200 `{"user":null}`. 쿠키 없이 `GET /api/listings` → 401 `unauthorized`.
- [ ] AC-7 (로그인 흐름): [카카오로 로그인] 직후 이동한 카카오 URL에 `client_id`, `redirect_uri=https://loan.conychoi.dev/api/auth/kakao/callback`, `response_type=code`, `state`가 있고 `scope`는 없다. 동의 후 `#/listings`, "카카오 계정에 저장 중". 응답 쿠키 `mf_session`이 `HttpOnly; Secure; SameSite=Lax`. D1 `users` 1행(`kakao_id`만), `sessions` 1행(`secret_hash`가 쿠키 secret과 다름). 동의 화면에서 취소 → "로그인을 취소했습니다". `state`를 바꾼 콜백 URL → "로그인하지 못했습니다". 로컬 개발의 로그인 확인은 `http://localhost`의 Chrome으로 한정한다(`Secure` 쿠키는 Safari의 `http://localhost`와 LAN `http://192.168.x.x`에서 저장되지 않는다고 추정, 브라우저 동작 미확인).
- [ ] AC-8 (서버 검증·상한): (a) `POST /api/listings/import`에 id `a/b`·65자 id·`createdAt:"2026-02-30"`·`updatedAt:"x"` → 각각 400 `invalidParams`. (b) 경로 id가 형식 위반(`PUT/PATCH/DELETE /api/listings/a%2Fb` 등) → 400. (c) import 101개 → 400, 100개 → 200 `{imported:100,skipped:0}`이고 `wrangler d1 execute`로 `listings` 행 수 100. (d) 합이 500을 넘는 상태에서 `POST /api/listings` → 400 `invalidParams`(500개일 때 501번째). (e) 같은 id가 요청에 두 번 → 뒤의 것은 `skipped`. (f) `PUT`에 `memo` 키를 넣어도 D1 `data`의 메모는 그대로. (g) `PATCH {memo:""}`는 `data`에서 `memo` 키를 지우고, `{memo}` 501자는 400. (h) 존재하지 않는 id의 PUT·PATCH·DELETE → 404.
- [ ] AC-9 (여러 기기): 같은 계정으로 로그인한 두 브라우저 A·B. A에서 저장·덮어쓰기·메모·삭제 → B에서 창을 다시 포커스하면 반영된다. 로그인 중 저장해도 localStorage `loan-calculator/listings` 원문은 바뀌지 않는다. 로그인 상태에서 공유 링크를 받아 추가하면 서버 목록에 들어간다(B에서도 보임). 삭제·로그아웃·공유 끊기(204 응답)에서 화면 오류와 콘솔의 JSON 파싱 오류가 없다.
- [ ] AC-10 (충돌·로그아웃): A·B가 같은 매물을 연 상태에서 A가 메모를 쓰고(PATCH), B가 계산 화면에서 매매가를 바꿔 덮어쓰기(PUT) → B의 매매가와 A의 메모가 둘 다 남는다. 반대로 B가 오래된 화면에서 메모만 고쳐도 A가 바꾼 매매가는 그대로다. A가 지운 매물을 B가 덮어쓰기 → "다른 기기에서 삭제된 매물입니다" + 입력값 유지 + [새로 저장] 가능. [로그아웃] → 로그인 전 로컬 목록이 보이고, 목록 캐시가 비워져(다른 계정으로 바로 로그인해도 이전 계정 목록이 순간 보이지 않음) `sessions` 행이 없어지며, 로그아웃 전 쿠키 값으로 `GET /api/listings` → 401. `/api/me`가 실패하는 상황(네트워크 차단)에서는 저장이 막히고 안내가 보이며 localStorage에는 쓰이지 않는다.

### 태스크 3 — 로컬 데이터 이전

- [ ] AC-11 (첫 로그인 이전): 로그아웃 상태에서 매물 3개(하나는 메모, 하나는 85㎡ 초과)를 저장한 브라우저로 처음 로그인 → 이전이 끝날 때까지 목록은 로딩이고("저장한 매물이 없습니다"가 보이지 않음) 끝나면 "이 기기의 매물 3개를 계정으로 옮겼습니다". 서버 목록 3개의 id·`createdAt`·`updatedAt`·메모·85㎡ 값이 로컬과 같다. localStorage `loan-calculator/listings` 원문은 그대로이고 `loan-calculator/account-imports`에 3개 id가 기록된다. 로컬 매물 250개면 import 요청이 100·100·50으로 3번 나가고 서버에 250개가 들어간다. 네트워크를 끊고 로그인하면 "옮기지 못했습니다 [다시 시도]"가 보이고, 복구 후 [다시 시도]로 옮겨진다.
- [ ] AC-12 (중복 없음): (a) 같은 브라우저에서 로그아웃→로그인 반복 → 서버 3개 그대로, 알림 없음. (b) 로그아웃 상태에서 1개 더 저장 후 로그인 → 그 1개만 옮겨 4개, "1개를 옮겼습니다". (c) 서버에서 1개 삭제 후 같은 브라우저 재로그인 → 되살아나지 않음. (d) 같은 본문으로 `POST /api/listings/import`를 두 번 → 두 번째 `imported:0`. (e) 로컬 2개가 있는 다른 브라우저로 로그인 → 합쳐 6개(이 브라우저에 다른 계정 기록이 없으니 묻지 않음). (f) 로컬 목록이 손상된 브라우저로 로그인 → 옮기지 않고 손상 안내, 서버 목록은 정상 표시. (g) 이미 계정 A로 옮긴 기록이 있는 브라우저에서 다른 카카오 계정 B로 처음 로그인 → 확인창이 한 번 뜬다. 취소하면 안 옮기고 B로 다시 로그인해도 묻지 않으며, 확인하면 옮긴다.

### 실기 확인 (리드, 검토자 지적)

- [ ] AC-13: (a) 360×780에서 저장 목록 카드의 버튼 4개(수정·복사·삭제·공유)와 머리글 [목록 공유]가 겹치거나 잘리지 않는다(간단히 보기의 펼친 카드 포함). (b) 카카오톡에서 공유 링크를 열어 보고(인앱 브라우저), 로그아웃 상태로 [내 목록에 추가]한 뒤 기본 브라우저(Safari/Chrome)에서 앱을 열어 그 매물이 보이는지 확인한다. 안 보이면 화면의 "이 브라우저에만 저장됩니다…" 안내가 이 상황을 설명하는지 확인한다. (c) 느린 네트워크(개발자 도구 throttling)로 첫 로그인 이전을 볼 때 이전 직후 빈 목록("저장한 매물이 없습니다")이 한 순간도 보이지 않는다.

## 태스크

### 파일 소유

be와 fe가 병렬로 일해도 같은 파일을 건드리지 않도록 소유를 나눈다. 다른 쪽 파일이 필요하면 직접 고치지 않고 소유자 태스크에 요청한다. 깨지는 기존 테스트는 소유자가 고친다.

- **be 소유**: `worker/`, `server/`(테스트 포함, 예: `server/aptTrades/handleAptTrades.test.ts`), `migrations/`, `tsconfig.worker.json`, 공유 검증 파일(`src/lib/utils/validateListingFields.ts`, `src/lib/utils/amount.ts`, `isOneOf.ts`, `validateListingMemo.ts`, `validateListingName.ts`, `src/lib/constants/loanConditions.ts`와 그 type-import 대상 중 `@/`를 쓰는 `src/lib/types/*`), `src/lib/types/api.ts`(새 파일).
- **fe 소유**: 그 밖의 모든 `src/`(`src/lib/api/client.ts`, `src/lib/types/listing.ts`·`route.ts`, `src/lib/utils/listingStorage.ts`·`listingStore.ts`·`parseRoute.ts`, `src/lib/constants/paths.ts`, `src/hooks/`, `src/components/`, `src/containers/`, `src/AppRoutes*` 등)와 그 테스트.
- **예외(선행 1-1)**: ApiError 이동과 검증 함수 분리는 fe 파일 몇 개를 건드린다. 그래서 **1-1은 be가 혼자 먼저 끝내 커밋하고, 그 뒤에 fe가 시작한다.** 1-1이 건드리는 fe 파일은 `src/lib/utils/listingStorage.ts`(+ `listingStorage.test.ts`), `src/lib/types/aptTrade.ts`, `src/lib/api/client.ts`·`src/containers/Mortgage/Calculator/describeTradesError.ts`의 import와 오류 코드 표 항목, 그 테스트(`describeTradesError.test.ts`)뿐이다. 1-1이 끝난 뒤에는 모두 fe 소유로 돌아간다. 1-2 이후 be 태스크(서버 쪽 `server/`·`worker/`·`migrations/`)는 fe 태스크와 겹치지 않아 병렬이다.

### 태스크 목록

- [x] 1. **공유 링크(로그인 없이 만들기·받기, 카카오 키 불필요)** — AC-1~AC-5
  - [ ] 1-1. **선행·be 단독(공유 계약 파일 정리)**
    - 공유 검증 함수를 `listingStorage.ts`에서 새 파일 `src/lib/utils/validateListingFields.ts`로 분리(`validateListingFields`·`isListingId`·`isIsoDateString`·`isListing`). `listingStorage.ts`는 그 파일을 import(`Storage` 사용 코드는 남김).
    - 공유 검증 파일과 전이 의존의 `@/` 별칭 import를 상대 경로로, DOM 타입 의존 제거. `pnpm build`의 `tsc -b`(worker 프로젝트)가 통과하는지 확인한다.
    - `ApiError`를 `src/lib/types/api.ts`로 옮기고 오류 코드(`unauthorized`·`forbidden`·`notFound`·`shareGone`·`payloadTooLarge` 포함) 추가, `aptTrade.ts`에서 삭제, 모든 import 수정. 이때 `Record<ApiError["error"], …>`로 코드 전체를 요구하는 `client.ts`와 `describeTradesError.ts`의 표에 항목을 추가해 타입이 통과하게 한다. 기존 테스트 import 수정: `server/aptTrades/handleAptTrades.test.ts`, 필요 시 `listingStorage.test.ts`·`describeTradesError.test.ts`.
    - `pnpm lint`·`format:check`·`test`·`build` 통과 후 커밋. (담당: be, 파일 소유: 위 예외 목록 + be 소유 파일)
  - [ ] 1-2. `migrations/0001_shares.sql`, 로컬 적용. `worker/index.ts` 라우팅을 경로 표로 정리(진입점은 얇게): 표에 없는 `/api/*`는 JSON 404, 메서드 불일치는 405 + `Allow`. `server/http/`(JSON·오류 응답, Origin 검사, 스트림 방식 본문 크기 제한 413). `Env`에 `DB` 추가. (담당: be, 파일 소유: `worker/`, `server/http/`, `migrations/`, `tsconfig.worker.json`)
  - [ ] 1-3. `server/shares/`: POST(100개·128KB, 만료 행 정리)·GET(만료는 410, 지우지 않음)·DELETE `/api/shares/{token}`, 토큰·ownerKey 생성과 해시 (담당: be, 파일 소유: `server/shares/`)
  - [ ] 1-4. `apiClient`에 `post`·`put`·`patch`·`delete` 추가(204는 본문 비파싱, 오류는 기존 `ApiRequestError`), `useCreateShare`·`useShare`(`staleTime: 0`)·`useRevokeShare` 훅(쿼리 키 `["share","item",token]`), `loan-calculator/sent-shares` 기록(만료 항목 정리, 끊으면 삭제) (담당: fe, 파일 소유: `src/lib/api/client.ts`, 공유 훅 파일)
  - [ ] 1-5. 승격: `Sheet`(+css)를 `src/components/`로, `useOpenSheet`를 `src/hooks/`로 옮기고 기존 사용처 import 수정. 공유 시트(카드 [공유], 머리글 [목록 공유], 메모 체크, 복사·공유하기·끊기, 끊은 뒤 [복사]·[공유하기] 제거 + [닫기], 101개 이상이면 안내). 360px 카드 버튼 4개 배치 (담당: fe, 파일 소유: `src/components/Sheet*`, `src/hooks/useOpenSheet.ts`, `src/containers/Mortgage/Listings/`, `src/containers/Mortgage/Calculator/components/SaveSheet.tsx` 등 import 수정, 관련 기존 테스트)
  - [ ] 1-6. `#/share/{token}` 라우트: `Route`에 `{ name: "share", token }`(토큰 대소문자 유지), `parseRoute`·`toRoutePath`·`PATHS.share(token)`, `TabNav` 좁히기(`current`가 탭 이름이거나 `null`). 공유받기 화면(응답 재검증, 로딩·성공·404/410·오류, 잘못된 토큰 모양), 로컬 스토어 일괄 추가(`addMany`, 한 번의 commit, 알려진 필드만), 완료 후 replace + 알림(메모리 상태), 로그아웃 상태 카카오톡 인앱 브라우저 안내 문구 (담당: fe, 파일 소유: `src/lib/utils/parseRoute*`, `src/lib/constants/paths.ts`, `src/lib/types/route.ts`, `src/components/TabNav.tsx`, `src/hooks/useHashRoute.ts`, `src/lib/utils/listingStore.ts`·`src/lib/types/listing.ts`, `src/AppRoutes*`, 공유받기 컨테이너 `src/containers/Mortgage/Share/`)
  - [ ] 1-7. 원격 마이그레이션 적용(`--remote`), AC-1~5 확인 (담당: 리드)
- [x] 2. **카카오 로그인 + 서버 저장(로그인 사용자는 서버가 원본)** — AC-6~AC-10
  - [ ] 2-1. `migrations/0002_accounts.sql`, `server/auth/session.ts`(만들기·검증·연장·삭제, Lucia 방식, 상수 시간 비교, 슬라이딩 갱신 한 곳, 쿠키 파싱 실패는 401) (담당: be, 파일 소유: `migrations/0002_*`, `server/auth/session.ts`)
  - [ ] 2-2. `server/auth/kakao*`: login·callback(state 쿠키, 토큰·사용자 정보 호출, `AbortSignal.timeout(10_000)`, users upsert는 DO NOTHING 후 SELECT, 로그인 시 같은 사용자의 만료 세션 정리), `/api/auth/logout`, `/api/me`, `Env`에 `KAKAO_REST_API_KEY`·`KAKAO_CLIENT_SECRET`, 미설정 시 notConfigured (담당: be, 파일 소유: `server/auth/`(session.ts 제외), `worker/` 라우팅 항목, `Env` 정의)
  - [ ] 2-3. `server/listings/`: GET·POST(500개 상한)·PUT(메모 보존 단일 UPDATE)·PATCH(메모 전용 단일 UPDATE)·DELETE `/api/listings`, `/api/listings/import`(1~100개, `json_each` 한 문장, imported/skipped, 상한), id·시각 검증은 1-1의 공유 검증 함수 사용 (담당: be, 파일 소유: `server/listings/`, `worker/` 라우팅 항목)
  - [ ] 2-4. 로그인 상태 클라이언트 기반 (담당: fe, 파일 소유: `src/hooks/`(계정 훅), `src/lib/types/route.ts`·`src/lib/utils/parseRoute*`, `src/AppRoutes*`, `src/containers/Mortgage/Listings/`의 계정 줄)
    - `Route`의 listings에 `login?`을 넣고 `toRoutePath`가 유지, 계정 줄이 값을 한 번 잡고 replace로 지움. 알림은 `AppRoutes` 메모리 상태.
    - 출처 상태 `loading | loggedOut | loggedIn | error`와 `useListingSource`(가칭): loading이면 쓰기 대기, error면 막음(로컬 폴백 금지), 로그아웃·401 때 목록 캐시 `removeQueries`.
    - 전역 승격 위치: `useMe`(쿼리 키 `["me","item"]`), 목록 훅 `useListingList`(`listingListQueryKey` = `["listing","list"]`, `staleTime: 0`, 포커스 재조회)·`useCreateListing`·`useUpdateListing`(PUT)·`useUpdateListingMemo`(PATCH)·`useDeleteListing`·`useImportListings`, `useAccountImport`(3-1)는 Calculator·Listings·Share 세 컨테이너가 쓰므로 모두 `src/hooks/`에 둔다.
    - 계정 줄(로그인 링크, 로그아웃, `error`·`login=` 안내, "로그아웃하면 이 기기에 있던 목록으로 돌아갑니다" 문구), 조회 실패 시 받아 둔 목록이 있으면 경고 한 줄만.
  - [ ] 2-5. 어댑터와 비동기 결과 처리 (담당: fe, 파일 소유: `src/containers/Mortgage/Calculator/`, `src/containers/Mortgage/Listings/`, `src/containers/Mortgage/Share/`, `src/lib/types/listing.ts`, 해당 기존 테스트)
    - `ListingStore`(동기)는 그대로 두고 `useListingSource` 어댑터가 로컬 결과를 `Promise.resolve`로 감싸 두 출처가 같은 Promise 결과 모양을 돌려준다. 메모 편집은 로그인 시 PATCH.
    - 계산 화면 저장 시트·목록 메모·삭제의 비동기 결과 처리(저장 중, 실패, 404, 401, 500개 상한), 저장 중 입력이 바뀌면 리셋하지 않고 알림만, `loading`·`error`에서 저장 버튼 비활성 + 이유, `MemoEditor`의 입력 보존, 공유받기·공유 만들기가 로그인 상태에서 서버 목록을 쓰게. 쓰기 실패 문구는 `Record<reason, string>` 유지.
    - **깨지는 기존 테스트 수정**: `AppRoutes.test.tsx`, `MortgageCalculator.test.tsx`, `ListingCard.test.tsx` 등. 새 테스트는 쓰지 않는다. `pnpm test` 통과.
- [x] 3. **기존 로컬 데이터 서버 이전(기기별 로그인 시, 로컬 유지, 중복 없음)** — AC-11, AC-12
  - [ ] 3-1. `useAccountImport`(`src/hooks/`, 앱 시작 시 두 화면 공통): `/api/me`가 사용자면 마커 비교 → (다른 userId 키가 있고 이 userId는 첫 이전이면 `window.confirm`, 취소 시 마커에 제외 기록) → 100개 단위 import(배치마다 마커 갱신) → 목록 무효화 → 알림. 이전이 정해질 때까지 목록 쿼리는 `enabled: false`(로딩 유지). 손상·접근 불가면 건너뛰고 안내, 실패하면 "옮기지 못했습니다 [다시 시도]". 실행 중 재진입 방지 (담당: fe, 파일 소유: `src/hooks/useAccountImport*`, `src/AppRoutes*`와 `src/containers/Mortgage/Listings/`의 알림 표시, `loan-calculator/account-imports` 헬퍼)
  - [ ] 3-2. 2·3을 한 PR로 묶어 배포, AC-6~12 확인, 실기 확인 AC-13 (담당: 리드)
  - be: 추가 작업 없음(2-3의 import 엔드포인트를 쓴다).

의존 관계:

- **1-1(be)이 먼저 끝나 커밋된 뒤** 1-2·1-3(be)과 1-4~1-6(fe)이 위 API 계약 기준으로 병렬이다. 1은 카카오 키와 무관하게 끝까지 진행·배포할 수 있다.
- 1-5는 1-4와 같은 fe 작업이라 순서대로 진행한다(1-5의 `Sheet` 승격이 먼저, 1-6의 라우트·공유받기는 그 뒤).
- 2-1~2-3(be)와 2-4·2-5(fe)는 병렬. 2의 실제 로그인 확인(AC-7, AC-9, AC-10)은 사용자가 카카오 키를 준 뒤에만 가능하다. 키 전까지는 AC-6, AC-8과 세션을 직접 만든 상태(`wrangler d1 execute`로 users·sessions 행 삽입 + 쿠키 수동 설정)로 목록 API를 확인한다.
- **2는 단독으로 배포하지 않는다.** 2만 나가면 기존 사용자가 로그인했을 때 로컬 목록이 안 보여 "데이터가 사라졌다"고 느낀다. 3과 한 PR로 머지한다.
- 3은 2-3(import)·2-4(`useMe`) 이후.

## 다음 단계 후보

- "보낸 공유 링크" 목록에서 나중에 끊기(`sent-shares`의 ownerKey 사용)
- 공유받을 때 매물 골라 가져오기(체크박스)
- 카카오톡에서 링크 미리보기(OG 태그): 경로형 링크 `/s/{token}` + Worker가 HTML에 메타 삽입
- 카카오톡 공유 SDK 메시지 템플릿
- 예산(`budget`)도 계정에 저장
- 이전 후 "이 기기의 로컬 목록 지우기" 버튼
- 오프라인 쓰기(로컬 캐시 + 동기화 큐) — ADR-023 뒤집을 조건
- 계정 삭제(탈퇴: users·sessions·listings 삭제 + 카카오 연결 끊기) 및 카카오 연결 해제 웹훅 처리
- `POST /api/shares` 호출 제한(Workers Rate Limiting 바인딩 또는 대시보드 규칙) — 익명 생성 남용·저장 공간 소진 대비
- 충돌을 "마지막 저장 우선" 대신 감지(409 + 비교 화면)
- 로그아웃 상태에서 고친 이전 완료 매물의 `updatedAt` 비교 병합(같은 id의 두 버전 갈라짐 해소)
- 계정 줄에 누구로 로그인했는지 표시(닉네임 동의항목)
- 부부 공동 목록(한 목록을 둘이 함께 편집) — 이번엔 사본 공유로 정함
- 만료 공유·세션 정리를 Cron Trigger로
- 사용자 매물 수 증가로 JSON 조회가 느려지면 필드별 컬럼(ADR-023 뒤집을 조건)

## 가정

- A1: 로컬 매물 id(16바이트 hex, ADR-010)를 서버 id로 그대로 쓴다. 서버가 새로 만드는 id도 같은 형식이다. 사용자 안에서만 유일하면 된다(PK `(user_id, id)`). 서버는 `^[A-Za-z0-9_-]{1,64}$`로 받는다.
- A2: 공유 링크는 토큰을 아는 누구나 열 수 있다(추측 불가 128비트가 접근 통제). 로그인·수신자 제한 없음.
- A3: 공유는 한 번에 1~100개·128KB 이하, 이전은 100개 단위 요청(요청당 512KB 이하), 사용자당 매물 500개 이하. 지금 사용 규모(부부 두 사람)에서 넉넉하다. 500개×메모 500자(한글 3바이트)는 이론상 750KB라 한 요청으로는 512KB를 넘을 수 있어 100개 단위로 나눈다.
- A4: 만료 공유 행은 `POST /api/shares` 때만 정리한다(GET은 지우지 않음, 크론 없음). 만료 세션은 검증 때와 로그인 때 지운다.
- A5: `redirect_uri`는 요청 origin으로 만든다(운영 `https://loan.conychoi.dev`). 등록 안 된 origin(PR 미리보기·LAN 주소)에서는 로그인이 안 된다. Cloudflare 라우팅 뒤에서는 Host 위조가 안 된다고 본다.
- A6: 카카오 토큰은 저장하지 않고, 우리 로그아웃은 카카오 로그아웃 API를 부르지 않는다.
- A7: 출처 상태가 `loading`인 동안 저장 목록은 로딩을 보이고 계산 화면의 저장 버튼은 비활성이다. 계산 화면도 `/api/me` 응답을 기다린다(이전 가정을 뒤집음, fe 검토).
- A8: 로그인 중 401(세션 만료)이 오면 `me`를 무효화해 로그아웃 상태로 바꾸고 목록 캐시를 지우며 안내한다. 입력 중인 값은 지우지 않는다.
- A9: 목록 조회 쿼리만 `staleTime: 0` + 포커스 시 재조회(공유 조회 `useShare`도 `staleTime: 0`). 전역 `retry: false`(ADR-014)와 전역 staleTime 10분은 그대로.
- A10: 서버 POST/PUT/PATCH의 `updatedAt`은 서버 시각이다. import는 넘어온 시각을 그대로 쓴다.
- A11: 원격 D1 마이그레이션은 Workers Builds가 자동 적용하지 않으므로 리드가 머지 전에 `--remote`로 적용한다. PR 미리보기(`wrangler preview`)에서 D1 바인딩이 운영 DB를 쓰는지는 **미확인** — 미리보기에서 쓰기 확인은 하지 않는다.
- A12: 공유받기 이름은 그대로 쓴다(이미 같은 이름이 있어도 붙임말 없음).
- A13: 공유 스냅샷에는 예산·draft·계산 결과를 넣지 않는다(입력값만, ADR-007).
- A14: D1 호출당 쿼리 수·바인딩 수 한도는 이번 검토에서 공식 문서를 열어 확인하지 못했다(검토자 기억에 근거, 미확인). 그래서 import는 한 문장(`json_each`)을 기본으로 하고, 구현 때 문서를 확인한다. 로컬 `wrangler dev`는 이 한도를 재현하지 않으므로 큰 import(100개)는 원격에서 확인한다.
- A15: 이 기기에서 다른 계정으로 이전한 기록이 있어 묻는 확인창은 `window.confirm`이고, 취소하면 보내려던 id를 마커에 넣어 다시 묻지 않는다(영구 제외).
- A16: 계정 줄에 로그인한 사람을 식별하는 정보는 보이지 않는다(회원번호만 저장). 한 PC를 둘이 쓰면 구분이 안 되는 점은 감수한다.

## 결정 필요

없음. D1~D5는 ADR-023(`../decisions/023-account-sync-share.md`)에서 모두 A로 결정됐다.

- D1: 결정됨(ADR-023) — A. 공유 데이터는 D1에 스냅샷 + 랜덤 토큰. 만료·끊기가 가능하고 링크가 짧다.
- D2: 결정됨(ADR-023) — A. 링크는 해시 라우트 `#/share/{token}`. 라우팅 한 곳에 하나만 더하고 토큰이 Referer에 남지 않는다.
- D3: 결정됨(ADR-023) — A. 로그인 상태 목록은 서버 원본 + react-query 훅, 쓰기는 비동기. ADR-001 개정. 오프라인 쓰기가 요구되면 B를 다시 본다.
- D4: 결정됨(ADR-023) — A. 서버 매물은 행마다 `data` JSON 본문 + 공유 검증 함수. 조건: id·시각 검증, 메모 보존 단일 UPDATE(위 계약에 반영).
- D5: 결정됨(ADR-023) — A. 세션은 D1 `sessions` + HttpOnly 쿠키. 로그아웃 즉시 폐기.

## 사용자 확인 필요

제품 기본값은 아래 "제안 기본값"으로 먼저 만든다. 다르게 원하면 알려 주면 바꾼다.

- U1 로그아웃 후 동작: **제안 기본값** — 이 기기에 로그인 전부터 있던 로컬 목록으로 돌아가고, 서버 목록은 이 기기에 남기지 않는다. 계정 줄에 "로그아웃하면 이 기기에 있던 목록으로 돌아갑니다"를 둔다. (대안: 로그아웃할 때 서버 목록을 로컬로 복사)
- U2 공유 링크 만료·끊기·한도: **제안 기본값** — 만든 뒤 30일 만료, 끊기는 만든 직후 공유 시트에서만(나중에 끊기는 다음 단계), 한 번에 최대 100개. 링크는 받은 누구나 열 수 있다.
- U3 공유할 때 메모: **제안 기본값** — 기본으로 보내지 않고, 시트의 [메모 함께 보내기]를 켜면 보낸다(메모에 연락처 등 개인 내용이 있을 수 있어서).
- U4 여러 기기 충돌: **제안 기본값** — 매물 단위로 마지막에 저장한 쪽이 이긴다. 메모는 메모를 고칠 때만 바뀌고, 계산 화면 덮어쓰기는 메모를 건드리지 않는다. 다른 기기에서 지운 매물을 고치면 안내하고 [새로 저장]을 보여 준다.
- U5 공유받기 화면 문구·동작: **제안 기본값** — 제목 "공유받은 매물 n개", 설명 "내 목록에 복사본으로 추가됩니다. 보낸 사람이 나중에 고쳐도 내 목록은 바뀌지 않아요.", 버튼 "내 목록에 추가 (n개)", 골라 받기 없이 전부 추가, 이름 그대로, 추가 후 저장 목록으로 이동 + "n개를 내 목록에 추가했습니다". 같은 링크를 다시 열어 또 추가하는 것은 막지 않는다. 로그아웃 상태에서는 "이 브라우저에만 저장됩니다. 카카오톡 안에서 열었다면 다른 브라우저에서는 보이지 않을 수 있어요…" 안내와 로그인 링크를 함께 보인다.
- U6 로컬 데이터 이전: **제안 기본값** — 확인 창 없이 자동으로 옮기고 알림만 띄운다. 기기별 첫 로그인 때 전부, 이후 로그인 때는 로그아웃 상태에서 새로 저장한 매물만 옮긴다. 내용이 같아도 다른 기기에서 따로 만든 매물은 둘 다 남긴다. **단, 이 기기에서 이미 다른 카카오 계정으로 이전한 기록이 있으면 새 계정의 첫 이전 때 "이 기기의 매물 n개를 내 계정으로 옮길까요?"를 한 번 묻는다**(한 기기를 둘이 쓰면 앞 사람의 매물이 뒷사람 계정으로 들어가는 것을 막기 위해). 취소하면 그 매물들은 이 계정으로 옮기지 않고 다시 묻지도 않는다. 이전이 끝날 때까지 목록은 로딩이다. (대안: 항상 묻기 / 아예 묻지 않기)
- U7 로그인 유지 기간: **제안 기본값** — 마지막 사용 후 30일(쓸 때마다 연장).
- U8 동기화 범위: **제안 기본값** — 매물만 계정에 저장한다. 내 예산·작성 중 입력·실거래가 시군구는 기기별로 둔다. 계정당 매물은 500개까지.
- U9 개인정보처리방침·탈퇴: 서버에 저장하는 것은 카카오 회원번호, 매물 입력값(이름·가격·소재지·보유 상태·LTV·85㎡ 여부·메모), 세션 해시, 공유 스냅샷(최대 30일)이다. 닉네임·이메일·카카오 토큰은 저장하지 않는다. 카카오는 개인정보 동의항목을 신청할 때 처리방침 URL을 요구하는데 회원번호만 쓰면 신청 자체가 없다. 그래도 개인정보 보호법상 처리방침 게시와 계정 삭제(탈퇴) 기능이 필요한지는 **확인 필요**다(보유 상태·메모가 개인 정보에 해당할 수 있음). 필요하면 다음 실행에서 처리방침 페이지와 탈퇴를 먼저 넣는다.
- U10 카카오 개발자 설정: (a) REST API 키·클라이언트 시크릿 전달(보드에 이미 올라 있음), (b) 카카오 로그인 사용 설정 ON, 동의항목은 설정하지 않음, (c) 로컬 개발에서도 로그인을 확인하려면 `http://localhost:8788/api/auth/kakao/callback`을 Redirect URI에 추가 등록할지. 등록하지 않으면 로그인 확인은 운영 주소에서만 한다. 로컬 확인은 `localhost`의 Chrome으로 한정한다(LAN 주소·Safari는 `Secure` 쿠키가 저장되지 않을 수 있음).
- U11 로그인 버튼 위치: **제안 기본값** — 저장 목록 머리글 아래 계정 줄 하나("이 기기에만 저장됩니다 · [카카오로 로그인]"). 계산 화면에는 두지 않는다.

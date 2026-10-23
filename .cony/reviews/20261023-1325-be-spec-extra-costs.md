# 추가 비용(extra-costs) 스펙 — be 검토

날짜: 2026-10-23 · 대상: `.cony/specs/extra-costs.md` · 코드 수정 없음(이 파일만 작성)

## 판정: 조건부 통과

AC-0(기존 데이터 보존)을 깨는 경로는 찾지 못했다. 서버 핸들러는 정말 무수정으로 따라온다(아래 확인). 조건 3개는 대부분 fe 쪽 확인 항목이고, be 쪽 필수 변경은 없다.

## 확인한 사실

### 서버가 무수정으로 따라오는가 — 예

- `server/listings/parseListingRequests.ts`: POST·PUT은 `validateListingFields(value.listing)` 반환값을, import는 `validateListingFields(listing)` 반환값을 `data`에 그대로 담는다. `server/shares/parseShareRequest.ts`도 반환값을 `validated`에 담는다. 반환 객체가 알려진 키만 새로 만들므로 `extraCosts`를 반환에 넣으면 세 경로에 모두 따라가고, 넣지 않으면 조용히 사라진다(스펙 서술과 일치).
- `handleListings.ts`: POST는 `JSON.stringify(parsed.value)`를 `data`에 넣는다. PUT은 `delete fields.memo` 후 `json(?3)` 또는 `json_set(?3,'$.memo',…)`로 **`data` 전체를 본문으로 교체**한다. 그래서 본문에 `extraCosts` 키가 없으면 지워진다(스펙 계약과 같음). PATCH는 `json_set/json_remove(data,'$.memo')`만 바꿔 `extraCosts`를 보존한다. import는 `json_extract(value,'$.data')`로 중첩 배열을 JSON 텍스트 그대로 옮긴다(`ON CONFLICT DO NOTHING`, 바인딩 2개). 모두 키 이름을 모르고 동작한다.
- `GET /api/listings`는 `{...JSON.parse(row.data)}`를 펼쳐 돌려준다. `GET /api/shares/{token}`은 `JSON.parse(payload)`를 그대로 돌려준다. 읽기 경로는 쓰지 않는다. 스키마·마이그레이션(`migrations/0001·0002`) 변경 없음, `extraCosts`라는 이름은 지금 코드·SQL 어디에도 없다(충돌 없음).
- 공유받기 후 로그인 상태 "내 목록에 추가"는 `useListingSource.addMany` → `importListings`(최대 100개)를 쓴다. 이 경로는 공유 본문이 128KB 이하이므로 import 본문 = 최대 약 131KB + 항목당 약 160B × 100 ≈ 147KB로 512KB 안쪽이다. 스펙이 짚은 `useAccountImport` 말고 import 호출처가 하나 더 있으나 크기 문제는 없다.

### 크기 계산 — 스펙 표와 재계산 일치

최악 필드(region `capitalNonRegulated`, borrower `oneHomeDisposal`, 이름 40자 한글, 금액 999,999,999, 분류 `appliance`, 항목 이름 30자 한글)로 Node에서 `JSON.stringify` 바이트를 직접 쟀다.

| 항목                              | 스펙                    | 재계산                                                                 |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| 공유 항목 1개(메모 없음)          | 4,638                   | 4,638                                                                  |
| 공유 목록 28개 / 30개             | 약 129,920 / 약 139,198 | 129,920 / 139,198 (128KB = 131,072 → 28개 통과, 29개(134,559)부터 413) |
| import 항목 1개(한글, 메모 500자) | 6,308                   | 6,298 (id 32자 기준, 오차 10B)                                         |
| import 100개(한글)                | 630,914                 | 629,914 → 512KB(524,288) 초과, 스펙 결론 동일                          |
| 메모 500자 포함 공유 항목         | 약 6.1KB                | 6,148 → 목록 공유는 21개 근처에서 한계                                 |

- 40개 단위 import: 한글 기준 약 252KB, 6바이트 이스케이프 최악 기준 스펙의 425,174바이트(여유 약 97KB). 결론 타당.
- D1 행 2MB 한도 안쪽(매물 1개 최대 약 10.6KB). import는 SQL 문장이 아니라 바인딩 1개라 문장 길이 한도와 무관하다는 서술도 코드(`json_each(?2)`)와 맞다. 단 바인딩 문자열 하나가 약 425KB까지 가는 것은 지금까지 최대(100개 × 약 1.9KB ≈ 194KB)보다 크다. 2MB 값 한도 안이라고 판단하지만 **실제 원격 D1에서 최대 크기 40개로 한 번 확인한 적은 없다**(miniflare/로컬 SQLite는 D1 한도를 증명하지 못함).

### 기존 서버 데이터 호환(AC-0)

- 기존 `data`에는 `extraCosts` 키가 없다. 검증이 "키 없음 = 통과"이므로 `GET /api/listings`의 `isListing`(`useListingList.ts:13`) 결과는 그대로다. 읽기만으로 쓰는 코드 없음(`listListings`는 SELECT뿐).
- 로컬 `parseListings`도 `isListing`만 쓰고 원본 배열을 그대로 돌려준다(저장소에 다시 쓰지 않음). 기존 로컬 데이터 판정 불변.
- 공유 링크: 옛 payload는 키가 없어 `parseShareResponse` 재검증을 그대로 통과한다.
- 롤백/옛 번들: 옛 `validateListingFields`는 모르는 키를 무시하므로 목록은 정상 표시된다. 옛 클라이언트의 PUT은 `extraCosts`를 지운다(A5 감수 항목). 옛 번들의 메모 편집은 서버 PATCH라 안전하지만, **로컬 모드에서는** 옛 번들의 `update` → `toListingFields`가 `extraCosts`를 떨어뜨리므로 메모 편집만으로도 추가 비용이 사라진다. A5는 "그 매물을 고칠 때만"이라고 적어 맞지만 메모 편집도 포함임을 명시하면 더 정확하다.

## 결정 필요 항목

- D1(데이터 흐름): **찬성(A).** 서버 PUT/PATCH SQL을 바꾸지 않고 `data` 교체·`memo`만 건드리는 기존 계약으로 충분하다. 조건: PUT은 "키 없음 = 삭제"라 fe의 서버 쓰기가 반드시 `toListingFields`를 거쳐야 한다(현재 `useListingSource.ts:211·217`은 거친다).
- D2(저장 형식): **찬성(A).** 평평한 선택 필드 배열이라 `json_each`/`json_set` 경로가 키 이름과 무관하게 동작하고 마이그레이션이 없다. B는 분류 추가 시 모양이 바뀌고, C는 import·공유 조립이 SQL로 늘어난다.
- D3(공유 128KB): **찬성(A).** 재계산으로 매물 1개 공유는 항상 들어가고(최대 6.1KB) 최악 목록 공유는 28개까지다. 한도는 익명 쓰기 보호이므로 올릴 근거가 없다. 413은 `payloadTooLarge` 코드로 구분되므로 문구 교체는 서버 변경 없이 가능하다.
- D4(import 배치): **찬성(A).** 서버 계약(1~100개·512KB) 유지, 클라이언트 40개로 최악에도 여유가 있다. 조건: 40이라는 숫자는 항목 이름 40자·메모 500자·추가 비용 30줄·30자라는 상한의 곱에서 나온 값이므로, 상한을 올리면 다시 계산해야 한다는 주석을 남기고(스펙 3-1이 이미 근거 주석을 요구), AC-7(c)에 최대 크기 40개 배치 한 번을 넣는다.

## 조건(통과 전 반영·확인)

1. **검증 함수 동작을 못 박는다.** `Object.hasOwn(value,"extraCosts")` 기준으로 키가 있으면 검증한다는 것은 기존 `customLtvRate`/`memo` 규칙과 같다. 그러면 `extraCosts: null`은 400이고 `[]`는 키 없이 통과이다. 이를 AC-6 curl에 `null`을 추가해 확인한다. 클라이언트는 `extraCosts: undefined` 키를 만들어 내부 객체를 `validateListingFields`에 넘기지 않도록 한다(JSON 직렬화를 거치면 사라지지만, 직렬화 전에 직접 검증하는 코드가 생기면 `undefined` 키가 "키 있음"으로 판정된다).
2. **같은 판단을 두 곳에 두지 않는다.** 항목 이름 규칙(코드포인트 1~30, trim 후 비어 있지 않음)이 서버 검증과 draft 줄 검증(fe, "이름 trim 후 1~30자")에 따로 생긴다. 이미 `validateListingName`/`validateListingFields`의 이름 규칙이 같은 식으로 갈라져 있다. 가능하면 be가 `validateExtraCostLabel`(성공 시 trim된 값, 실패 시 문구) 순수 함수를 한 곳(`src/lib/utils/`)에 두고 `validateListingFields`와 fe 줄 검증이 함께 쓴다. 서버는 trim하지 않고 원문 길이를 센다는 점(클라이언트가 먼저 trim)도 주석으로 남긴다.
3. **원격 확인 범위를 넓힌다.** AC-7(c)에 "추가 비용 30줄 꽉 찬 40개 배치 한 번"을 넣고, AC-0(b)의 `SELECT id, data, updated_at` 전후 비교는 그대로 둔다. 그리고 배포는 1·2·3을 한 PR로 묶는다는 스펙 방침을 지킨다(1만 나가면 100개 배치가 413).

## 리스크

- (중, 장기) 검증 규칙을 나중에 좁히거나(예: 30줄 → 20줄) 분류 enum을 늘리면, `GET /api/listings` 응답 전체를 `every(isListing)`로 검사하는 클라이언트는 **행 하나만 어긋나도 목록 전체를 `loadFailed`로 본다.** 옛 번들을 가진 다른 기기가 새 분류가 든 서버 데이터를 읽으면 같은 일이 생긴다. 로컬은 A3/ADR-012로 감수한다고 했으나 서버 동기화 후에는 영향이 기기 간으로 커진다. 규칙을 좁히는 변경은 스키마 변경과 같은 취급이 필요하다. 이번 스펙 범위에서는 조치 불필요, 기록만.
- (낮) 이름 검사는 `trim()` 기준이라 폭 없는 공백(U+200B)만 있는 이름은 통과한다. 짝 없는 서로게이트·제어 문자도 `countChars` 1로 통과하며 JSON에서 6바이트로 이스케이프된다(크기 표는 이미 이를 최악으로 반영). 매물 이름·메모에 이미 있는 구멍과 같고 보안 영향은 없다(React 이스케이프, 바이트 상한은 계산에 포함).
- (낮) `GET /api/listings`는 페이지네이션이 없고 `toListing`이 행마다 `JSON.parse`한다. 한 계정이 500개를 최대 크기(약 5.3MB)로 채우면 Worker CPU 시간(무료 플랜)을 넘길 수 있으나, 본인 계정에서만 일어나는 이론상 상한이다. 실사용(수십 개)은 문제없다.
- (낮) 로컬 읽기 `isListing`이 `extraCosts`가 어긋나면 전체 목록 corrupt 처리한다(A6). 우리 코드만 쓰고 쓰기 전에 같은 함수로 검증하므로 생기지 않지만, 다른 탭의 옛 번들이 `update`로 키를 지우는 경우는 있어도 어긋난 값을 만드는 경우는 없다.
- (참고) 스펙 문서 중 "PUT은 메모만 보존" 서술은 코드와 일치한다. D1 `PUT`이 키 이름을 모르는 `json(?3)` 교체라는 점이 이번 기능에서 가장 중요한 계약이므로 fe 구현 시 서버 PUT 본문이 `toListingFields` 결과인지 AC-5(PUT으로 줄 모두 삭제 → 키 없음)에서 반드시 본다.

## 확인하지 않은 것

- 원격 D1에서 약 425KB 바인딩 import(스펙의 D1 한도 서술은 스펙이 인용한 Cloudflare 문서를 근거로 하며 나는 문서를 다시 열지 않았다).
- 코드 실행(curl/wrangler)은 하지 않았다. 검토 모드이며 크기 재계산만 임시 스크립트로 했다.

# screenshot-ocr 스펙 — client-dev 검토

날짜: 2026-10-22

판정: **조건부 찬성** (구조와 흐름은 타당. 아래 필수 수정 4개를 스펙에 반영하면 구현 가능)

확인한 것: 스펙 전문, CLAUDE.md, ADR-017/019/020, `PasteSheet.tsx`, `vite.config.ts`, `wrangler.jsonc`. `tesseract.js`는 아직 설치돼 있지 않아 v7 소스 동작은 직접 확인하지 못했다. 아래 라이브러리 동작은 **추론**으로 표시한다.

## 결정 필요

- **D1 tesseract.js 7.0.0 + kor best_int: 찬성.** 검증된 브라우저 OCR이고 순수 JS라 Vite 플러그인이 필요 없으며, `ocrSession.ts` 안 동적 import로 메인 번들과 분리된다. 리스크는 한국어 인식률과 iOS Safari 메모리다(워커 100MB대). AC-5의 두 번째 실행 10초 기준과 ADR-020 뒤집을 조건이 안전장치로 충분하다.
- **D2 vite-plugin-static-copy로 `dist/ocr/` 자체 호스팅: 조건부 찬성.** 제3자 요청 0건이 "어디에도 보내지 않습니다" 문구를 지키는 유일한 방법이고, `wrangler.jsonc`는 `dist` 전체가 자산이라 변경이 없다. 조건은 필수 수정 1·2다. 리스크는 SPA 대체(`not_found_handling`) 때문에 파일이 빠져도 404가 아니라 `index.html`이 200으로 내려가 원인이 숨는다는 점이다.

## 필수 수정

1. **자산 경로는 절대 URL로 준다.** (추론, 구현 시 dev에서 확인) tesseract.js 브라우저 워커는 `workerPath`를 Blob URL 워커 안에서 `importScripts`한다. Blob 워커 안의 상대 경로(`/ocr/...`는 되더라도 `./ocr/`나 `base` 변경 시)는 해석이 깨질 수 있다. `ocrSession.ts` 상수를 `new URL("/ocr/...", location.origin).href` 형태로 만들고, `corePath`와 `langPath`도 같은 방식으로 한다(`corePath`는 끝에 `/`). 스펙 "모듈 계약"에 이 줄을 추가한다.
2. **자산 존재를 빌드에서 잡는다.** 플러그인 복사 대상이 비어도 빌드가 통과하고, 런타임에는 HTML을 JS로 실행하다 알 수 없는 오류가 난다. AC-4에 "`pnpm build` 뒤 `dist/ocr/` 파일 5개 존재"를 이미 적었으나 수동 항목이다. `pnpm build`에 대한 확인을 태스크 1-1 완료 조건(복사 대상 glob이 0건이면 실패)으로 올리고, 응답 `Content-Type`이 JS/wasm인지 AC-4에서 함께 본다. 버전이 바뀐 뒤 옛 캐시가 남지 않도록 경로에 버전을 넣는 것(`/ocr/7.0.0/`)은 선택이다.
3. **`recognizing` 중에는 파일 입력을 막는다.** iOS에서 "다른 스크린샷 고르기"를 연타하거나 시트 안에서 재선택하면 `start`가 겹친다. 훅 계약에 "`recognizing`이면 `start`는 무시하거나 먼저 `cancel`한다" 한 줄을 적고, 버튼을 `disabled`로 둔다. AC-3 훅 단위 테스트에 포함한다.
4. **360px 레이아웃 조건을 스펙에 적는다.** "인식한 글자 보기" 원문은 줄이 길고 개행이 많다. `white-space: pre-wrap; overflow-wrap: anywhere; max-height + overflow:auto`를 쓰지 않으면 시트가 가로로 넘치거나 적용 버튼이 화면 밖으로 밀린다. 적용/다른 스크린샷 버튼은 원문이 펼쳐져도 고정 위치(시트 하단 actions)에 둔다. 결과 영역은 `idle`/`recognizing`/`done` 사이에서 최소 높이를 같게 해 버튼이 흔들리지 않게 한다.

## 그 밖의 확인 사항 (필수 아님)

- 파일 선택기 흐름은 타당하다. `accept="image/*"`는 iOS에서 보관함과 카메라를 함께 제안하고, 버튼 클릭에서 숨은 input을 `click()`하면 사용자 제스처 안이라 막히지 않는다. 비이미지 검사는 `file.type`으로 하고, 값 비우기(iOS 재선택)는 `change` 처리 직후에 한다.
- 취소 중 `preparing`이면 내려받던 코어/언어 데이터가 끊긴다. 다시 시작하면 처음부터 받는 것이 정상 동작이라는 점을 AC-5에 기록한다(두 번째 실행 시간 측정이 취소 직후와 섞이지 않게).
- Safari 사생활 보호 모드 등에서 IndexedDB 캐시가 실패하면 매번 1.5MB를 다시 받는다. 오류로 막히지 않는지만 AC-5에서 본다.
- 접근성: `aria-live` 진행 문구는 1% 단위로 갱신하면 화면 낭독이 시끄럽다. 10% 단위로 줄이거나 문구는 `preparing`/`recognizing` 전환 때만 읽게 한다.
- 메인 번들 분리는 스펙대로면 충족한다(동적 import는 `ocrSession.ts` 한 곳, 테스트는 `vi.mock`). AC-4의 "빌드 출력에서 별도 청크"는 `pnpm build` 청크 목록으로 바로 확인된다.
- react-query를 쓰지 않는 근거(기기 안 계산)는 CONVENTIONS와 충돌하지 않는다.

## 계약에 없는 API

없음 (HTTP 추가 없음). 결정 필요 외 추가 항목 없음.

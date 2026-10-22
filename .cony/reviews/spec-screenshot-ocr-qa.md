# screenshot-ocr 스펙 — QA 검토

날짜: 2026-10-22 · 모드: 검토(가볍게, 사용자 요청)

## 판정: 조건부 찬성

## 근거

1. 모킹 경계가 좋다. `tesseract.js`가 `ocrSession.ts` 안의 동적 import로만 들어오고 테스트는 그 모듈을 `vi.mock`한다. 그러면 jsdom은 wasm이나 Worker를 아예 로드하지 않는다. 모킹은 jsdom에서 문제없이 동작한다. 조건은 훅과 시트가 `tesseract.js`를 직접 import하지 않는 것이다.
2. AC-1~3은 판정 가능하다. 입력(fixture 텍스트), 모킹 반환값, 기대 출력(`salePrice`, 문구, `terminate` 호출)이 모두 정해져 있다. AC-2는 통합 #8을 교체하므로 8개 상한이 유지된다.
3. fixture 3개는 정상 / 공백 잡음 / 전세만 다룬다. 스펙이 정한 실패 이유 3개 중 `empty`와 `priceNotFound`는 빠져 있고, 새 전처리 규칙 대부분도 빠져 있다. fixture를 늘리지 말고 인라인 `it.each` 한 줄짜리 케이스로 채우는 편이 가볍다. 아래 필수 수정 2번을 본다.

## 필수 수정 (5개)

1. **`ocrSession`이 통째로 모킹돼 아무 테스트도 없다.** 가장 틀리기 쉬운 곳은 logger `status`를 `preparing`/`recognizing`으로 옮기는 매핑이다. 이 매핑은 수동 확인에서만 드러난다. 매핑을 순수 함수(`toOcrProgress(msg)`)로 빼고 표 형태 단위 테스트를 한다. 케이스는 `recognizing text`+progress 0.4, 나머지 status 4개, 알 수 없는 status 1개다. 워커 재사용과 terminate 뒤 새 워커는 수동 AC-5로 넘긴다. 이 항목은 인정한다.
2. **AC-1을 닫는다.**
   - "사라졌다"는 명령으로 판정한다: `grep -rniE "linkOnly|URL_PATTERN|shareText|ShareText|SharePreview|PasteSheet|붙여넣기" src` 결과가 0건이어야 한다. 단, `src/lib/utils/__fixtures__/` 안에서 지운 `assumed-*` 공유 텍스트 3쌍은 디렉터리째 없어져야 한다.
   - 인라인 케이스를 최소로 추가한다. 빈 문자열은 `empty`다. 매매 키워드 없이 금액만 있으면 `priceNotFound`다. `전 세 7억`과 `월 세`는 `notSale`이다. `5 천`은 금액으로 읽힌다. 양쪽 단위 면적 `112.39㎡/84.97㎡`는 `84.97㎡`를 고른다. 한글 없는 줄만 있는 입력(상태 표시줄)은 단지명이 없다. `101동`과 `<` 제거도 확인한다.
   - **오탐 방지 케이스**를 반드시 넣는다. `관리비 25만원`, `25/35층` 같은 숫자-단위 사이 공백 제거가 다른 숫자에 붙지 않아야 한다. 전처리가 틀린 값을 만드는 것이 가장 해롭다.
   - AC-5가 "`salePrice`와 성공/실패 이유만 단언"한다고 하는데, 기존 `it.each`가 `toEqual`로 expected 전체를 비교하면 실제 fixture를 넣을 수 없다. 비교를 `toMatchObject`로 바꾸는지 구현자가 확인해야 한다. 이 변경은 기대값을 느슨하게 하는 것이 아니다. 실제 fixture에서 쓰지 않는 필드를 단언하지 않는다는 의미다.
3. **테스트 이음새를 스펙에 못박는다.**
   - 훅이 `createOcrSession()`을 부르는 시점과 소유자를 정한다. 시트가 닫히면 시트가 언마운트되는지(`Sheet`가 닫힘 상태에서 children을 렌더하지 않는지), 아니면 닫기 핸들러가 `cancel()`을 부르는지 정한다. AC-3의 "시트를 닫으면 terminate"가 어느 쪽인지 정해야 판정할 수 있다.
   - 숨긴 `input[type=file]`에 접근 가능한 이름(`aria-label="스크린샷 파일"` 등)을 준다. 그래야 `user.upload`로 테스트할 수 있다. 업로드 파일은 `new File([...], "a.png", { type: "image/png" })`로 만든다. user-event는 `accept`에 안 맞는 파일을 걸러 내므로 `이미지 파일을 골라 주세요` 케이스는 `applyAccept: false`나 `fireEvent.change`로 따로 발생시켜야 한다. 구현자가 알도록 한 줄 적는다.
   - 훅은 이미지를 디코딩하지 않고 `File`을 그대로 `recognize`에 넘긴다고 적는다. jsdom에는 `createImageBitmap`과 `URL.createObjectURL`이 없다.
   - AC-3은 모킹 `recognize`가 **직접 resolve할 수 있는 deferred Promise**를 돌려주고 `onProgress`를 호출하게 만들어 확인한다. 순서는 시작, 진행 문구와 "취소"가 보인다, 취소한다, `terminate` 호출을 확인한다, 그 뒤에 deferred를 resolve한다, 미리보기가 안 뜬다. 마지막 단언이 핵심이다.
4. **AC-4 확인 절차를 구체화한다.**
   - 배포 미리보기(`pnpm build` 후 wrangler)에서 확인한다. dev 서버는 복사 플러그인이 다르게 동작해서 증거가 못 된다.
   - 사이트 데이터와 IndexedDB를 지운 뒤 Network 탭에서 "Disable cache"를 켜고 시작한다.
   - 합격 조건: (a) 전체 요청의 호스트가 현재 출처 하나뿐이고, (b) POST/PUT 등 GET이 아닌 요청이 0건이고, (c) `/api/*` 요청이 0건이다. `blob:` 워커 요청은 네트워크가 아니므로 제외한다.
   - `kor.traineddata.gz`의 응답 `Content-Encoding` 헤더를 기록하고 인식이 실제로 성공하는지 본다. Cloudflare가 헤더를 붙이면 이중 압축 해제로 실패할 수 있다.
   - 빌드 검사는 명령으로 적는다: `ls -l dist/ocr dist/ocr/core dist/ocr/lang`에서 5개 파일을 확인한다. `grep -l createWorker dist/assets/*.js`가 가리키는 청크가 첫 페이지 로드의 Network 목록에 **없어야** 한다(분리 확인).
5. **AC-5를 판정 가능하게 한다.**
   - 합격값을 적는다. 가정 텍스트를 화면에 띄워 찍은 이미지에서 `salePrice`가 125,000만원이어야 한다. 실제 U5 이미지는 리드가 눈으로 아는 정답과 비교한다.
   - 시간 측정 구간을 정한다: 파일 선택 시점부터 미리보기가 뜨는 시점까지다. "두 번째 실행"은 **시트를 닫았다 다시 연 뒤 첫 인식**으로 정의한다. A3 때문에 일상 사용이 이쪽이고, 같은 시트에서 두 번째 장은 워커를 재사용해 더 빠르기 때문이다. 같은 시트의 두 번째 장 시간은 별도로 적는다.
   - 기록 항목: 기기, 브라우저, 네트워크, 첫 실행 / 시트 재오픈 / 같은 시트 두 번째 장 시간, 완료 여부(iPhone에서 워커 메모리로 탭이 죽는지 포함).

## D1·D2 중 테스트에 영향 주는 것

- **D1 (OCR 엔진) — 찬성(A).** 테스트는 `ocrSession` 모킹으로 엔진과 무관하다. 계약(`recognize`/`terminate`)만 지키면 B로 바꿔도 테스트가 그대로다. C는 ADR-020과 충돌하고 textarea 테스트를 되살리므로 반대. 리스크: 가정 fixture는 실제 tesseract 출력이 아니어서 통과해도 인식 품질을 보증하지 않는다. 그 보증은 AC-5(수동)와 U5 fixture뿐이다. 결과 보고에서 이 점을 분명히 한다.
- **D2 (자산 위치) — 조건부 찬성(A, 자체 호스팅).** 제3자 도메인 요청 0건을 AC-4로 직접 검증할 수 있는 유일한 선택이다. 조건: 복사 단계를 `pnpm build` 뒤 `dist/ocr/` 5개 확인(필수 수정 4)으로 반드시 확인한다. 리스크: 복사 플러그인은 경로가 틀려도 파일 0개로 조용히 성공할 수 있고, 단위 테스트는 이것을 못 잡는다. 이 경우 화면에서만 "인식 도구를 불러오지 못했습니다"로 드러난다. 그리고 `tesseract.js`와 `tesseract.js-core` 버전 불일치는 런타임 실패가 되므로 둘 다 정확한 버전으로 고정한다.

## 자동 테스트로 검증할 수 없는 항목 (화면 확인)

- 실제 인식 정확도와 속도, iPhone Safari 메모리, Content-Encoding 동작, 사진 보관함/카메라 선택 UI, 다크 모드 인식, iOS 같은 파일 재선택 시 `change` 발생(input 값 비우기).
- 클립보드 이미지 붙여넣기(시나리오 6, 2단계). 자동 테스트 없이 수동만 한다는 스펙 입장에 동의한다.

## 버그 재현 확인 제안 (구현 뒤)

- 훅에서 "취소된 결과 버림"을 임시로 지우면 AC-3 테스트가 실패해야 한다.
- 전처리의 공백 제거를 지우면 `assumed-02`가 실패해야 한다.
- 적용 시 `kbPrice: ""`를 지우면 AC-2가 실패해야 한다.

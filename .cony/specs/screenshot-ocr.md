# 스크린샷으로 매매가 채우기 (브라우저 안 OCR)

작성일: 2026-10-22 · 브랜치: `cony/screenshot-ocr` · 근거 결정: [ADR-020](../decisions/020-remove-paste.md)(텍스트 붙여넣기 → 스크린샷 OCR), [ADR-021](../decisions/021-ocr-engine-assets.md)(OCR 엔진·자산 위치), [ADR-017](../decisions/017-trade-sheet.md)(적용 규칙, 공통 Sheet), [ADR-019](../decisions/019-link-import-excluded.md)(네이버 서버 접근 금지), [ADR-018](../decisions/018-integration-test-cap.md)(통합 테스트 8개)
선행 스펙: [ltv-options-and-import.md](ltv-options-and-import.md) 태스크 3·AC-7(붙여넣기). 이 스펙이 그 입력 경로를 대체한다. 파서와 적용 규칙은 그대로 쓴다.

테스트 강도: 사용자 요청("테스트 너무 빡세게 하지 말 것")에 따라 가볍게 한다. fixture 파일은 늘리지 않는다(가정 fixture 3쌍만). 나머지 케이스는 인라인 `it.each` 한 줄짜리로 채운다. 파서는 OCR 결과 텍스트로, OCR 엔진은 모킹한 통합 테스트 1개로 확인한다. 가정 fixture는 실제 tesseract 출력이 아니므로 통과해도 인식 품질을 보증하지 않는다. 그 보증은 AC-5(수동)와 U5 fixture뿐이다. 실제 인식은 리드가 브라우저에서 직접 확인한다.

## 목표

네이버부동산 앱에는 공유 텍스트 복사가 없다. 그래서 매물 화면 스크린샷을 올리면 **브라우저 안에서** 글자를 읽어 매매가를 채우고 저장 이름(단지명·면적 추정)을 제안한다. 이미지는 기기 밖으로 나가지 않는다. 우리 서버로도, 네이버로도 보내지 않는다.

## 사용자 시나리오

1. 네이버부동산 앱 매물 상세 화면에서 스크린샷을 찍는다. 계산기 입력 섹션 맨 위의 "스크린샷으로 채우기"를 누르면 시트가 열린다. 시트에는 "이미지는 이 기기 안에서만 읽고 어디에도 보내지 않습니다"라는 안내와 "스크린샷 고르기" 버튼이 있다.
2. 버튼을 누르고 사진 보관함에서 방금 찍은 스크린샷을 고른다. 처음 쓸 때는 "인식 준비 중(처음 한 번 약 6MB 내려받음)"이 보이고, 이어서 "글자 읽는 중 40%"처럼 진행률이 보인다. 시간이 오래 걸리면 "취소"를 누를 수 있고, 그러면 다시 이미지를 고르는 상태로 돌아간다.
3. 인식이 끝나면 미리보기에 "매매가 12억 5,000만원 · 단지(추정) 래미안OO · 면적 84.97㎡"가 뜬다. 적용하면 생기는 일도 함께 보인다: "KB시세는 비워집니다", "실거래가 단지명 칸에도 채웁니다". "인식한 글자 보기"를 펼치면 읽은 원문이 보인다.
4. "적용"을 누르면 매매가가 채워지고 KB시세는 비워진다. 편집 중이던 매물과의 연결이 풀리고, 사용자 지정 LTV는 꺼진다. 시트가 닫히고 포커스는 KB시세 칸으로 간다. 저장할 때 이름 칸에 "래미안OO 84.97㎡"가 제안된다.
5. 전세 매물 화면을 올렸다면 "매매 매물이 아닌 것 같습니다(전세·월세)"가 뜬다. 계산 입력은 바뀌지 않는다. "다른 스크린샷 고르기"로 다시 고를 수 있다.
6. (2단계, 데스크톱 등) 이미지를 복사한 상태에서 시트를 열고 붙여 넣으면(Ctrl/Cmd+V) 파일을 고른 것과 같이 인식을 시작한다.

## 참고한 사례

- **tesseract.js** ([github.com/naptha/tesseract.js](https://github.com/naptha/tesseract.js), Apache-2.0): 브라우저 OCR에서 사실상 표준이다. Tesseract C++ 엔진을 WebAssembly로 빌드했고 Web Worker에서 돈다. 100개 이상 언어를 지원하며 `kor`도 있다. 이번 기능의 엔진이다(ADR-021). 이 라이브러리의 관례를 그대로 따른다. 워커는 한 번 만들어 재사용하고 이미지마다 새로 만들지 않는다([performance.md](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)). 진행률은 `logger`로 받는다. 취소는 `worker.terminate()`로 한다(작업 단위 취소 API는 문서에 없다, [api.md](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)).
- **Apple Live Text / Google Lens**: 스크린샷 속 글자를 OS가 읽어 선택하게 한다. "스크린샷에서 값 꺼내기"는 사용자에게 익숙한 동작이라는 근거로 삼는다. 다만 이 기능은 앱 밖에서 일어나고, 결국 텍스트 붙여넣기가 필요하다(ADR-020에서 삭제한 경로). 그래서 앱 안에서 읽는다.
- **토스 × 삼성 메시지 송금 버튼** (선행 스펙에서 참고): 자유 텍스트에서 찾은 값을 바로 덮어쓰지 않는다. 미리보기로 보여 주고, 사용자가 확인하면 적용한다. OCR은 틀릴 수 있어서 이 패턴이 더 중요하다. 그대로 유지한다.
- **Tesseract 품질 가이드** ([tessdoc ImproveQuality](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)): Tesseract 4 이상은 밝은 바탕의 어두운 글자를 전제로 한다(다크 모드 위험). 흩어진 글자에는 PSM 11(sparse text)이 맞다. tesseract.js 기본값은 PSM 6(SINGLE_BLOCK)이다. 2단계 조정의 근거다.

## 범위

- 포함:
  - "붙여넣기로 채우기" 시트를 "스크린샷으로 채우기" 시트로 바꾼다. 입력은 이미지 파일 선택이다(`<input type="file" accept="image/*">`, 모바일에서는 사진 보관함과 카메라). 텍스트 입력(textarea) 경로는 삭제한다(ADR-020).
  - 브라우저 안 OCR(tesseract.js 7.0.0)과 그 자산(워커·wasm 코어·한국어 데이터)의 자체 호스팅(ADR-021). OCR 라이브러리는 시트에서 처음 이미지를 고를 때 동적 import로 불러온다. 메인 번들에는 넣지 않는다.
  - 인식 중 진행 표시(준비 / 읽는 중 %)와 취소. 시트를 닫아도 취소된다.
  - 인식 텍스트 → 기존 파서(`parseKoreanPrice`, 매물 텍스트 파서) → 미리보기 → 적용. 적용 규칙은 ADR-017과 현재 코드 그대로다: `kbPrice` 비움, `listingId` 해제, `customLtv` 끔, 이름 제안, 단지명 힌트, KB시세 칸 포커스.
  - 파서에서 공유 텍스트 전용 규칙(URL 제거, `linkOnly`)을 삭제한다. OCR이 흔히 끼워 넣는 공백(`12 억`, `매 매`)과 화면 잡음(상태 표시줄, 뒤로 가기 기호)을 견디게 한다. 관련 이름을 "공유 텍스트"에서 "매물 텍스트"로 바꾼다.
  - (태스크 2) 클립보드 이미지 붙여넣기, 실제 스크린샷(U5)으로 파서·인식 설정 조정, 실기기 수동 확인.
- 범위 밖:
  - 서버 OCR, 외부 OCR API(Google Vision, CLOVA OCR 등). 이미지가 기기 밖으로 나간다.
  - 네이버 서버 접근, 링크 가져오기(ADR-019).
  - 이미지 저장, 썸네일 표시, 자르기·회전 UI
  - KB시세·층·동 등 매매가 외 값을 계산 입력에 채우는 것(이름 제안과 단지명 힌트만)
  - 여러 매물이 보이는 목록 화면에서 매물 하나 고르기(다음 단계 후보)
  - 오프라인 PWA(서비스 워커). 언어 데이터는 라이브러리가 IndexedDB에 캐시하는 것으로 충분하다.

## 데이터 모델

저장 형식 변경은 없다. localStorage의 `listings`, `draft`, `trade-lookup`은 그대로다. 이미지와 인식 텍스트는 시트 컴포넌트 메모리에만 있다가 시트가 닫히면 사라진다.

예외가 하나 있다. tesseract.js는 한국어 데이터(`kor.traineddata`)를 IndexedDB에 캐시한다(라이브러리 기본 `cacheMethod: "write"`, idb-keyval 사용). 이것은 공개 모델 파일이고 사용자 데이터가 아니다. 그대로 둔다.

### 모듈 계약

| 이름             | 위치                                                               | 계약                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OCR 세션         | `src/lib/utils/ocrSession.ts`                                      | `createOcrSession(): OcrSession`. `OcrSession = { recognize(image: Blob, onProgress: (p: OcrProgress) => void): Promise<string>; terminate(): Promise<void> }`. `OcrProgress = { phase: "preparing" } \| { phase: "recognizing"; ratio: number }`. `tesseract.js`는 이 파일 안에서만 동적 `import()`한다. 첫 `recognize`에서 워커를 만들고(`createWorker("kor", 1, { workerPath, corePath, langPath, logger })`) 이후에는 재사용한다. `terminate` 뒤의 `recognize`는 새 워커를 만든다. **자산 경로**(ADR-021)는 이 파일의 상수로 두고, 모두 `new URL("/ocr/...", location.origin).href` 형태의 절대 URL이다(워커가 Blob URL 안에서 `importScripts`하므로 상대 경로는 깨질 수 있다). `corePath`와 `langPath`는 디렉터리라서 끝에 `/`를 붙인다.                                                                                |
| 진행 변환        | `src/lib/utils/ocrSession.ts`에서 export                           | `toOcrProgress(msg: { status: string; progress: number }): OcrProgress`. 순수 함수다. `status`가 `"recognizing text"`이면 `{ phase: "recognizing", ratio: progress }`, 그 밖(`loading tesseract core`, `initializing tesseract`, `loading language traineddata`, `initializing api`)과 알 수 없는 status는 `{ phase: "preparing" }`이다. logger는 이 함수를 거쳐 `onProgress`를 부른다. 단위 테스트 대상이다(AC-3).                                                                                                                                                                                                                                                                                                                                                                                                          |
| 인식 상태 훅     | `src/containers/Mortgage/Calculator/hooks/useScreenshotOcr.ts`     | `{ state, start(file: File), cancel() }`. `state`는 `idle` / `recognizing(progress)` / `done(text)` / `error`. **소유자**: 훅은 `ScreenshotSheet` 안에서만 쓰고, 첫 `start`에서 `createOcrSession()`을 부른다. 열린 시트가 없을 때는 `ScreenshotSheet`가 렌더되지 않으므로(공통 `Sheet`는 부모가 렌더할 때만 존재한다) 시트를 닫으면 언마운트 정리가 `terminate()`를 부른다. 닫기 핸들러가 따로 부르지 않는다. **`recognizing`이면 `start`는 무시한다**(iOS 연타 방어). `cancel`은 `terminate()`를 부르고 `idle`로 돌아간다. 취소된 작업의 결과는 버린다. 훅은 이미지를 디코딩하지 않고 `File`을 그대로 `recognize`에 넘긴다(jsdom에는 `createImageBitmap`, `URL.createObjectURL`이 없다). react-query는 쓰지 않는다. 네트워크 API가 아니라 기기 안의 계산이기 때문이다(CONVENTIONS의 react-query 규칙은 API 요청 대상이다). |
| 매물 텍스트 파서 | `src/lib/utils/parseListingText.ts` (← `parseListingShareText.ts`) | `(text) => ListingTextParseResult`. 성공 모양은 지금과 같다(`salePrice`, `complexName`, `areaText`, `suggestedName`). 실패 이유는 `"empty" \| "notSale" \| "priceNotFound"`이고 `linkOnly`는 삭제한다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 적용             | `…/Calculator/applyListingText.ts` (← `applyShareText.ts`)         | 동작은 그대로다(`salePrice` 채움, `kbPrice: ""`, `listingId: null`, `customLtv: null`). 이름만 바꾼다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 미리보기         | `…/components/ListingPreview.tsx` (← `SharePreview.tsx`)           | 그대로 쓴다. "인식한 글자 보기"(`<details>`)는 시트가 붙인다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 시트             | `…/components/ScreenshotSheet.tsx` (← `PasteSheet.tsx`)            | 공통 `Sheet` 프레임을 쓴다. 열린 시트 키 `"paste"`는 `"screenshot"`으로 바꾼다. 숨긴 `input[type=file]`에는 `aria-label="스크린샷 파일"`을 준다. `recognizing` 중에는 "다른 스크린샷 고르기"와 파일 입력을 `disabled`로 둔다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

`parseKoreanPrice.ts`와 `pickSuggestedName.ts`는 바꾸지 않는다(OCR 공백 처리는 매물 텍스트 파서의 전처리에서 한다).

### 파서 정리 (OCR 텍스트용)

- 삭제: `URL_PATTERN` 제거 단계, `linkOnly` 이유와 그 테스트, `assumed-*` 공유 텍스트 fixture 3쌍(`__fixtures__/shareText/` 디렉터리째). 스크린샷에는 URL이 없다.
- 유지: `매매` 뒤 첫 금액, 전세·월세만 있으면 `notSale`, 면적(`㎡`/`m²`/`m2`/`평`, `전용` 뒤 우선, 공급/전용 쌍), 단지명은 "무엇이 없는 줄인가"로 추정한다. `네이버` 줄 제외도 유지한다(앱 머리글이 찍힐 수 있다).
- 추가(OCR 전처리, 가정 A4): 숫자와 금액 단위 사이 공백을 없앤다(`12 억 5,000` → `12억 5,000`, `5 천` → `5천`). `매 매`, `전 세`, `월 세`도 키워드로 읽는다. 공백 제거는 **금액 단위(억·천·만)에만** 붙고 다른 숫자·단위(`25만원`, `25/35층`)는 건드리지 않는다. 그 밖의 오인식(`0`/`O`, `,`/`.`)은 고치지 않는다. 추측 보정이 틀린 값을 만들 수 있어서다. 실제 스크린샷(U5) fixture에서 반복해서 보이면 그때 더한다.
- 추가(단지명 추정, 화면 잡음): 지금 규칙은 "글자가 하나라도 있는 줄"을 후보로 본다. 그래서 상태 표시줄(`9:41 al LTE @`)이 단지명으로 잡힌다. 후보 줄은 **한글을 포함**해야 한다. 고른 줄은 앞뒤의 글자 아닌 기호(`<`, `‹`, `@` 등)와 끝의 동 번호(`101동`)를 떼어 낸다. 동 번호가 남으면 실거래가 단지명 필터가 0건이 된다.
- 추가(면적 쌍): 지금 `AREA_PATTERN`은 `112/84㎡`(단위가 뒤에 하나)만 쌍으로 본다. 상세 화면 표기 `112.39㎡/84.97㎡`(양쪽에 단위)에서는 앞의 공급면적을 고른다(2026-10-22 코드에서 따라가 확인). 양쪽에 단위가 있는 쌍도 뒤 값(전용)을 고르게 한다.
- fixture 위치: `src/lib/utils/__fixtures__/screenText/NN-name.txt` + `NN-name.expected.json`. 기존 `it.each` 구조를 그대로 쓴다(비교는 이미 `toMatchObject`다. 유지한다. 실제 fixture에서 쓰지 않는 필드를 단언하지 않는다는 뜻이다). 가정 fixture는 `assumed-` 접두를 붙이고, U5 실제 OCR 결과는 접두 없이 넣는다. 새 fixture 파일은 가정 3쌍 외에 만들지 않고 나머지 케이스는 테스트 파일의 인라인 `it.each`로 둔다(AC-1).

### 가정한 화면 텍스트 (U5 전까지)

앱 매물 상세 화면을 tesseract로 읽었을 때 나올 것으로 가정한 텍스트다. 상태 표시줄, 버튼 글자, 잡음이 섞인다. 실제 배치는 U5 스크린샷으로 확인한다.

`assumed-01-detail.txt` (정상, 기대: `salePrice: 125000`, `complexName: "래미안OO"`, `areaText: "84.97㎡"`)

```
9:41 al LTE @
< 래미안OO 101동
매매 12억 5,000
아파트 · 112/84㎡ · 25/35층 · 남향
확인매물 25.10.20.
OO공인중개사사무소 제공
매물특징 역세권, 올수리
공급/전용면적 112.39㎡/84.97㎡(전용률 76%)
해당층/총층 25/35층
방수/욕실수 3/2개
관리비 25만원
전화 문의
```

- 첫 줄(상태 표시줄)은 한글이 없어 단지명 후보가 아니다. 둘째 줄에서 `<`와 `101동`을 떼면 `래미안OO`가 된다(위 "단지명 추정" 규칙).
- 관리비 `25만원`이 매매가로 읽히면 안 된다. `매매` 뒤 첫 금액이 `12억 5,000`이므로 지금 규칙으로 안전하다.
- 면적은 `전용` 뒤 첫 면적을 우선한다. `전용면적 112.39㎡/84.97㎡`에서 위 "면적 쌍" 규칙으로 `84.97㎡`를 고른다.

`assumed-02-ocr-noise.txt` (OCR 잡음, 기대: `salePrice: 98000`, `complexName: "헬리오시티"`, `areaText: "59m2"`)

```
헬리오시티
매 매 9 억 8,000
아파트 84/59m2, 12/29층
```

`assumed-03-jeonse.txt` (기대: `{ ok: false, reason: "notSale" }`)

```
래미안OO 101동
전세 7억
아파트 · 112/84㎡ · 25/35층
```

## API 계약

HTTP 엔드포인트는 추가하지 않는다. 서버(`worker/`, `server/`)는 바꾸지 않는다.

정적 자산(ADR-021, Workers Static Assets로 서빙):

| 경로                                                               | 출처                                           | 크기(확인값)                      |
| ------------------------------------------------------------------ | ---------------------------------------------- | --------------------------------- |
| `/ocr/worker.min.js`                                               | `tesseract.js@7.0.0/dist/worker.min.js`        | 111,307 B                         |
| `/ocr/core/tesseract-core-{relaxedsimd-,simd-,}lstm.wasm.js` (3개) | `tesseract.js-core@7.0.0`                      | 각 3.90 MB(3,896,484~3,905,767 B) |
| `/ocr/lang/kor.traineddata.gz`                                     | `@tesseract.js-data/kor@1.0.0/4.0.0_best_int/` | 1,572,336 B                       |

- 기기는 코어 3개 중 하나만 받는다(라이브러리가 relaxed SIMD → SIMD → 기본 순서로 감지한다). 처음 한 번 받는 양은 약 5.6MB(압축 전)다. 언어 데이터는 IndexedDB에, 코어는 HTTP 캐시에 남는다.
- 모든 파일이 Workers Static Assets 파일당 한도 25 MiB 안에 든다([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). 이번에 추가하는 파일은 5개다.
- `corePath`는 디렉터리로 준다. 파일 하나로 지정하면 SIMD 감지를 건너뛰어 느려지거나 일부 기기에서 실패한다고 공식 문서가 경고한다([local-installation.md](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)). 라이브러리는 LSTM 전용(`oem` 1, 기본값)일 때 `-lstm` 파일만 고른다. 그래서 비-LSTM 3개는 복사하지 않는다. 이 동작은 `src/worker-script/browser/getCore.js`(v7.0.0)에서 확인했다.
- 언어 데이터는 `.gz` 그대로 서빙하고 라이브러리가 직접 푼다(`gzip: true` 기본). Cloudflare가 이 파일을 `Content-Encoding`으로 바꿔 보내지 않는지는 AC-4 수동 확인에서 함께 본다.
- SPA 대체(`not_found_handling`) 때문에 빠진 자산은 404가 아니라 `index.html` 200으로 내려가 원인이 숨는다. 그래서 빌드에서 잡는다(태스크 1-1 완료 조건)과 `Content-Type` 확인(AC-4)을 둔다.

## 화면

1. **진입**: 입력 섹션 맨 위 보조 버튼 "스크린샷으로 채우기"(현재 "붙여넣기로 채우기" 자리). 누르면 시트가 열린다. 파일 선택기를 바로 열지 않는 이유는 가정 A2에 있다.
2. **스크린샷 시트** (공통 `Sheet`, 제목 "스크린샷으로 채우기")
   - `idle`: 안내 2줄("네이버부동산 앱의 매물 상세 화면을 캡처해 올리세요", "이미지는 이 기기 안에서만 읽고 어디에도 보내지 않습니다")과 주 버튼 "스크린샷 고르기"(숨긴 `input[type=file][accept="image/*"][aria-label="스크린샷 파일"]`를 연다).
   - `recognizing`: "인식 준비 중…(처음 한 번 약 6MB 내려받음)" 또는 "글자 읽는 중 NN%"(`<progress>`), 그리고 "취소" 버튼. 진행 문구는 `aria-live="polite"`로 둔다. 이 상태에서는 파일 입력과 "다른 스크린샷 고르기"가 `disabled`다.
   - `done` + 성공: `ListingPreview`(현재 → 새 매매가, 적용 효과 목록), "인식한 글자 보기"(접힘), 버튼 "다른 스크린샷 고르기"(보조) / "적용"(주).
   - `done` + 실패: 이유별 문구를 그대로 쓴다. `notSale`은 "매매 매물이 아닌 것 같습니다(전세·월세)", `priceNotFound`는 "매매가를 찾지 못했습니다. 매물 상세 화면인지 확인하거나 금액을 직접 입력하세요"다. 빈 텍스트(`empty`)는 "글자를 읽지 못했습니다"다. "인식한 글자 보기"와 "다른 스크린샷 고르기"는 그대로 보인다. "적용"은 비활성이다.
   - `error`(엔진·자산 로드 실패, 이미지 해독 실패): "인식 도구를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도하세요"와 "다시 시도"(같은 파일로 재시작). 이미지가 아닌 파일(`file.type`이 `image/`로 시작하지 않음)이면 "이미지 파일을 골라 주세요"를 보여 준다.
   - 닫기(×, Esc, backdrop, 취소 후 닫기)는 시트를 언마운트하고, 인식 중이면 훅의 언마운트 정리가 `terminate()`한다.
   - **360px 폭 조건**: "인식한 글자 보기" 원문은 `white-space: pre-wrap; overflow-wrap: anywhere; max-height`를 주고 `overflow: auto`로 안에서 스크롤한다. 시트가 가로로 넘치지 않는다. "적용"과 "다른 스크린샷 고르기"는 원문이 펼쳐져도 시트 하단 actions 고정 위치에 있고 화면 밖으로 밀리지 않는다. 결과 영역은 `idle`/`recognizing`/`done` 사이에서 최소 높이를 같게 해 버튼 위치가 흔들리지 않게 한다.

- **매일 쓰는 사람이 반복해서 겪을 불편**
  - 두 번째부터는 내려받기가 없다(언어 데이터 IndexedDB, 코어 HTTP 캐시). 시트를 다시 열 때 워커 초기화 비용(수백 ms~수 초, 측정 대상)만 남는다. 시트 단위로 워커를 만들고 닫을 때 정리한다(가정 A3).
  - 인식이 끝나도 계산 입력은 바뀌지 않는다(미리보기 → 적용). 잘못 읽었으면 "다른 스크린샷 고르기"나 직접 입력으로 넘어간다.
  - 틀린 이유를 볼 수 있게 인식 원문을 접어서 보여 준다. 실패 문구는 시트 안 결과 자리에 둔다.
  - 적용 뒤 KB시세 칸으로 포커스가 간다(기존 그대로).
  - iOS에서 같은 파일을 다시 고르면 `change`가 안 뜨는 문제를 막는다. 고를 때마다 `change` 처리 직후 input 값을 비운다.

## 수용 기준

- [ ] AC-1: **OCR 텍스트 파서.**
  - `__fixtures__/screenText/`의 가정 fixture 3개(정상 상세, OCR 잡음, 전세)가 `it.each`로 통과한다. `parseKoreanPrice`의 기존 테스트는 바꾸지 않고 통과한다.
  - 정리 확인은 명령으로 한다: `grep -rniE "linkOnly|URL_PATTERN|shareText|ShareText|SharePreview|PasteSheet|붙여넣기" src`가 0건이고, `src/lib/utils/__fixtures__/shareText/`가 없다. (태스크 2-1을 구현한 뒤에는 클립보드 이미지 처리 줄의 "붙여넣기"만 예외다.)
  - 인라인 `it.each` 케이스(fixture 파일 추가 없음): 빈 문자열 → `empty` / 매매 키워드 없이 금액만 → `priceNotFound` / `전 세 7억`, `월 세 80` → `notSale` / `5 천`이 들어간 `매매 9억 5 천` → 95000 / `112.39㎡/84.97㎡` → `84.97㎡` / 한글 없는 줄만 있는 입력(상태 표시줄) → 단지명 없음 / `< 래미안OO 101동` → `래미안OO`.
  - **오탐 방지 케이스**(필수): `관리비 25만원`, `25/35층`, `방수/욕실수 3/2개` 줄이 있는 입력에서 공백 제거가 이 숫자들에 붙지 않아 `salePrice`와 면적이 바뀌지 않는다.
- [ ] AC-2: **시트 흐름(통합 #8 교체, OCR 모듈 모킹).** `vi.mock("…/ocrSession")`로 모킹하고, `aria-label="스크린샷 파일"` input에 `user.upload`로 `new File(["x"], "a.png", { type: "image/png" })`를 올린다. 모킹된 `recognize`가 `assumed-01` 텍스트를 돌려주면 미리보기에 매매가와 "KB시세는 비워집니다"가 보인다. "적용" 전에는 매매가 칸이 바뀌지 않는다. 적용 후에는 매매가가 채워지고, KB시세는 비고, 편집 중이던 매물 연결이 풀리고, 저장 시트 이름 칸에 제안 이름이 들어간다. 모킹이 전세 텍스트를 돌려주면 `notSale` 문구가 보이고 입력값은 그대로다. 통합 테스트는 8개를 넘지 않는다(ADR-018). 이미지가 아닌 파일 케이스("이미지 파일을 골라 주세요")는 user-event가 `accept`로 파일을 걸러 내므로 `fireEvent.change` 또는 `applyAccept: false`로 발생시키는 단위 테스트 1개로 둔다(통합 개수에 넣지 않는다).
- [ ] AC-3: **진행과 취소.**
  - `toOcrProgress` 표 테스트(인라인 `it.each`): `recognizing text`+0.4 → `{ recognizing, 0.4 }`, 나머지 status 4개 → `preparing`, 알 수 없는 status 1개 → `preparing`.
  - 훅 단위 테스트(모킹 `recognize`가 직접 resolve할 수 있는 deferred Promise를 돌려주고 `onProgress`를 호출한다). 순서: `start` → 진행 문구와 "취소"가 보인다 → `recognizing` 중 `start`를 다시 불러도 `recognize`는 1번만 호출된다 → 취소 → `terminate` 호출 확인 → 그 뒤에 deferred를 resolve → 미리보기가 나타나지 않는다(마지막 단언이 핵심). 시트를 닫는(언마운트) 경우도 `terminate` 호출을 확인한다.
  - 워커 재사용과 `terminate` 뒤 새 워커는 자동 테스트하지 않고 AC-5 수동으로 본다.
- [ ] AC-4: **기기 밖으로 보내지 않음(수동, 리드).**
  - 환경: `pnpm build` 후 wrangler 배포 미리보기에서 확인한다(dev 서버는 복사 플러그인이 다르게 동작해 증거가 못 된다). 사이트 데이터와 IndexedDB를 지우고 Network 탭 "Disable cache"를 켠 뒤 스크린샷 1장을 인식한다.
  - 합격: (a) 전체 요청의 호스트가 현재 출처 하나뿐이다. (b) POST/PUT 등 GET이 아닌 요청이 0건이다. (c) `/api/*` 요청이 0건이다. `blob:` 워커 요청은 네트워크가 아니므로 제외한다. (d) `/ocr/*` 응답의 `Content-Type`이 JS/wasm/바이너리이고 `index.html`(text/html)이 아니다. (e) `kor.traineddata.gz` 응답의 `Content-Encoding` 헤더를 기록하고 인식이 실제로 성공한다(헤더가 붙어 이중 해제로 실패하면 불합격).
  - 빌드 검사(명령): `ls -l dist/ocr dist/ocr/core dist/ocr/lang`에서 5개 파일이 각각 25 MiB 이하로 있다. `grep -l createWorker dist/assets/*.js`가 가리키는 청크는 첫 페이지 로드의 Network 목록에 없고, 시트에서 이미지를 고른 뒤에 나타난다(메인 번들 분리).
- [ ] AC-5: **실제 인식(수동, 리드·U5 이후 확정).**
  - 합격값: 가정 텍스트(`assumed-01`)를 화면에 띄워 찍은 이미지에서 `salePrice`가 125,000만원이어야 한다. 실제 U5 이미지는 리드가 눈으로 아는 정답과 비교한다. 데스크톱 Chrome과 iPhone Safari에서 한다. U5의 OCR 결과 텍스트는 실제 fixture(접두 없음)로 추가하고 `salePrice`와 성공/실패 이유만 단언한다.
  - 시간 측정 구간: 파일 선택 시점부터 미리보기가 뜨는 시점까지. "두 번째 실행"은 **시트를 닫았다 다시 연 뒤 첫 인식**이다(A3 때문에 일상 사용이 이쪽이다). 같은 시트에서 두 번째 장의 시간(워커 재사용)은 따로 적는다. 두 번째 실행이 10초를 넘으면 ADR-020 "뒤집을 조건" 검토 대상으로 보고한다.
  - 기록 항목: 기기, 브라우저, 네트워크, 첫 실행 / 시트 재오픈 / 같은 시트 두 번째 장 시간, 완료 여부(iPhone에서 워커 메모리로 탭이 죽는지 포함).
  - 참고: 준비 중에 취소하면 내려받던 코어·언어 데이터가 끊기고 다음에 처음부터 받는 것이 정상이다. 시간 측정이 취소 직후 실행과 섞이지 않게 한다. IndexedDB 캐시가 실패하는 환경(사생활 보호 모드 등)에서도 오류로 막히지 않는지만 본다.

## 태스크

- [ ] 1. **스크린샷 → 인식 → 미리보기 → 적용 (엔드투엔드 최소)** — AC-1, AC-2, AC-3, AC-4
  - [ ] 1-1. 의존성과 자산(ADR-021): `tesseract.js`와 `tesseract.js-core`를 같은 정확한 버전 7.0.0으로 직접 의존성에 고정하고(범위 표기 `^` 없음, pnpm은 전이 의존성을 끌어올리지 않는다), `@tesseract.js-data/kor`를 추가한다. 빌드할 때 위 표의 파일 5개를 `dist/ocr/`로 복사하고(`vite-plugin-static-copy` 또는 `vite.config.ts` 안 짧은 인라인 플러그인), dev 서버에서도 같은 경로로 서빙되게 한다. `wrangler.jsonc`는 바꾸지 않는다(dist 전체가 자산이다). **완료 조건**: 복사 대상이 0건이면 `pnpm build`가 실패한다(경로·glob이 틀려도 조용히 통과하지 않는다). 빌드 뒤 `dist/ocr/` 파일 5개가 존재한다. 자산 경로 상수가 절대 URL이고 `corePath`/`langPath` 끝에 `/`가 있다(모듈 계약). (담당: client)
  - [ ] 1-2. `ocrSession.ts`(동적 import, 워커 재사용, `toOcrProgress`, terminate)와 `useScreenshotOcr`(`recognizing` 중 `start` 무시, 취소된 결과 버림, 언마운트 정리) (담당: client)
  - [ ] 1-3. 파서 정리: 이름 바꾸기(`parseListingText`, `applyListingText`, `ListingPreview`), URL·`linkOnly` 삭제, OCR 공백 전처리(금액 단위에만), 단지명 후보 한글 필수와 기호·동 번호 떼기, 양쪽 단위 면적 쌍, 가정 fixture 3쌍 교체 (담당: client)
  - [ ] 1-4. `ScreenshotSheet`로 교체: 상태 4개, 파일 선택(`aria-label`, `recognizing` 중 disabled), 진행·취소, 인식 원문 접기(360px 조건), 이미지 아닌 파일 처리. 시트 키 `"screenshot"`. `PasteSheet`와 textarea 스타일은 삭제한다. 진입 버튼 문구를 바꾼다. 적용 핸들러는 지금의 `handlePasteApply` 동작을 그대로 쓴다 (담당: client)
  - [ ] 1-5. 테스트(가볍게): AC-1 가정 fixture와 인라인 케이스, `toOcrProgress` 표 테스트, 통합 #8 교체(AC-2), 훅 취소 1개(AC-3). 실제 tesseract는 테스트에서 로드하지 않는다 (담당: test)
- [ ] 2. **실사용 다듬기** — AC-5, 시나리오 6
  - [ ] 2-1. 클립보드 이미지 붙여넣기: 시트가 열려 있을 때 `paste` 이벤트의 `clipboardData.files` 중 첫 `image/*`를 `start`에 넘긴다. 데스크톱 Chrome·Safari에서 수동 확인만 한다. iOS에서 붙여넣기 메뉴가 안 뜨면 그대로 둔다(파일 선택이 주 경로) (담당: client)
  - [ ] 2-2. U5 실제 스크린샷으로 수동 확인(AC-5): 인식 원문을 fixture로 추가하고 실패하면 파서를 고친다. 인식률이 낮으면 PSM(기본 6 → 3 또는 11)과 다크 모드(밝기 반전 필요 여부)를 비교해서 더 나은 쪽 하나만 반영한다 (담당: client / 수동 확인: 리드)

의존 관계: 결정(D1·D2)은 ADR-021로 끝났으므로 1-1을 바로 시작할 수 있다. 1-2와 1-3은 병렬로 할 수 있다. 1-4는 1-2와 1-3 뒤다. 2-1은 1 뒤에 언제든 할 수 있다. 2-2는 U5 스크린샷이 와야 한다. U5가 없으면 가정 텍스트로 AC-5를 "부분 확인"으로 보고한다.

요구사항 → 태스크: 이미지 입력(1-4, 2-1) · 브라우저 안 OCR(1-1, 1-2) · 기기 밖 전송 없음(1-1 자체 호스팅, AC-4) · 파서 재사용과 OCR 정리(1-3) · 미리보기·적용 규칙(1-4, AC-2) · 진행·취소(1-2, 1-4, AC-3) · textarea 삭제(1-4) · 실제 화면 확인(2-2).

## 다음 단계 후보

- 목록 화면(매물 여러 개) 스크린샷: `매매` 금액이 여럿이면 후보를 골라 적용하기
- 이미지 썸네일 표시, 영역 자르기(가격 부분만 인식해 속도·정확도 개선, tesseract `rectangle` 옵션)
- 면적·층을 매물 데이터로 저장(선행 스펙의 "매물에 면적·원본 링크 저장"과 함께)
- 다른 앱(호갱노노, KB부동산) 화면 fixture 추가
- 시트를 열 때 워커를 미리 데워 두기(첫 인식 체감 단축). 측정에서 준비 시간이 길게 나오면 검토한다.
- 공유 시트로 이미지 받기(Web Share Target, PWA 필요)
- 자산 경로에 버전 넣기(`/ocr/7.0.0/`): 버전을 올릴 때 옛 HTTP 캐시가 남지 않게 한다
- `aria-live` 진행 문구를 10% 단위로 줄이기(화면 낭독 소음)

## 가정

- A1: 사용자는 매물 **상세** 화면(매물 하나, "매매 12억 5,000" 형식의 가격 줄)을 캡처한다. 목록 화면은 첫 `매매` 금액을 쓰고, 미리보기에서 사용자가 확인한다.
- A2: 진입 버튼은 시트를 연다. 파일 선택기를 바로 열지 않는다. 시트에 프라이버시 안내, 진행·취소, 실패 문구를 둘 자리가 필요하고, 2단계 클립보드 붙여넣기의 대상도 시트다. 공통 `Sheet` 프레임과 열린 시트 상태 하나(ADR-017)를 그대로 쓴다.
- A3: 워커는 시트를 처음 인식할 때 만들고, 시트가 닫히거나 취소될 때 `terminate()`한다. 한 시트에서 여러 장을 고르면 재사용한다. 메모리를 많이 쓰므로(v5 기준 워커 약 164MB, 릴리스 노트) 화면 전체 수명 동안 남겨 두지 않는다.
- A4: Tesseract 한국어 출력에는 글자·숫자 사이에 공백이 끼는 일이 흔하다고 보고 공백만 정규화한다. 근거가 될 실제 샘플이 없으므로 U5로 확인한다.
- A5: 언어는 `kor` 하나다. 숫자, `㎡`, 라틴 문자는 `kor` 모델로 읽는다고 본다. `kor+eng`는 데이터가 두 배라서 U5에서 숫자 인식이 나쁠 때만 검토한다.
- A6: 스크린샷은 PNG/JPEG이다(iOS 스크린샷은 PNG). tesseract.js 공식 지원 형식은 bmp/jpg/png/pbm/webp/gif이고 HEIC는 없다([image-format.md](https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md)). HEIC 사진이 들어오면 `error`로 처리한다.
- A7: 처리 시간에 대한 공식 한국어 벤치마크는 찾지 못했다. AC-5에서 측정하고, ADR-020의 "뒤집을 조건"(직접 입력보다 느림)을 시트 재오픈 후 첫 인식 10초로 잡는다.
- A8: 통합 테스트 #8을 교체하므로 개수는 8개를 유지한다(ADR-018).

## 결정됨

- D1 OCR 엔진: `tesseract.js` 7.0.0 + `kor` `4.0.0_best_int` — [ADR-021](../decisions/021-ocr-engine-assets.md)
- D2 워커·wasm·언어 데이터 위치: 빌드 때 `dist/ocr/`로 복사해 자체 호스팅. 절대 URL 경로, `corePath` 끝 `/`, 복사 0건이면 빌드 실패, 두 패키지 정확한 버전 고정 — [ADR-021](../decisions/021-ocr-engine-assets.md)

## 결정 필요

없음

## 사용자 확인 필요

- U5(이미 요청함, board): 네이버부동산 앱 **매물 상세 화면** 스크린샷 1~2장(매매 1장, 가능하면 다크 모드나 목록 화면 1장). 연락처·중개사 이름은 가려도 된다. 가정 텍스트(A1, "가정한 화면 텍스트")와 실제 배치를 맞추고 AC-5를 닫는 데 쓴다. 제품 목표를 바꾸는 확인은 아니다. 그 밖에는 없음.

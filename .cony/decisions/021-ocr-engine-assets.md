# ADR-021 OCR은 tesseract.js 7.0.0 + kor best_int, 자산은 dist/ocr에 자체 호스팅

- 상태: 채택
- 맥락: 스크린샷 OCR(ADR-020)의 엔진과 엔진 파일(worker·wasm 코어·언어 데이터) 위치(D1, D2).
- 선택지: D1 A tesseract.js 7.0.0 / B PaddleOCR.js / C OS 기능으로 복사한 텍스트 붙여넣기. D2 A vite-plugin-static-copy로 dist/ocr 자체 호스팅 / B jsDelivr CDN / C public/에 커밋
- 의견: pm(D1 A, D2 A) / fe(D1 찬성, D2 조건부: 절대 URL 경로·corePath 끝 /·복사 0건이면 빌드 실패, SPA 대체 때문에 빠진 자산이 index.html 200으로 숨는 위험) / qa(D1 찬성, D2 조건부: dist/ocr 5개 파일 확인, tesseract.js·core 정확한 버전 고정)
- 검토 원문: [fe](../reviews/spec-screenshot-ocr-fe.md) · [qa](../reviews/spec-screenshot-ocr-qa.md)
- 결정: D1 A, D2 A. tesseract.js와 tesseract.js-core를 같은 정확한 버전(7.0.0)으로 직접 의존성에 고정. 자산 경로는 location.origin 기준 절대 URL, corePath는 디렉터리(끝 /). 복사 대상이 0건이면 빌드 실패. tesseract.js는 ocrSession.ts의 동적 import로만 들어와 메인 번들과 분리.
- 이유: 검증된 표준이고, 자체 호스팅이어야 "이미지를 어디에도 보내지 않는다"를 네트워크로 검증할 수 있다. 파일 크기는 Workers Static Assets 한도 안이다.
- 뒤집을 조건: 실제 스크린샷 인식률이나 속도가 직접 입력보다 못할 때(ADR-020), iPhone Safari에서 메모리로 탭이 죽을 때.

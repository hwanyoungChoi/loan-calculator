# 스크린샷 OCR로 매물 매매가·면적 채우기

> 상태: 진행 중 · 마지막 업데이트: 2026-10-22 11:59

## 태스크

- [ ] 1. **스크린샷 → 인식 → 미리보기 → 적용 (엔드투엔드 최소)** — AC-1, AC-2, AC-3, AC-4 [REVIEW · 리드]
- [ ] 2. **실사용 다듬기** — AC-5, 시나리오 6

## 백로그

- 목록 화면(매물 여러 개) 스크린샷: `매매` 금액이 여럿이면 후보를 골라 적용하기
- 이미지 썸네일 표시, 영역 자르기(가격 부분만 인식해 속도·정확도 개선, tesseract `rectangle` 옵션)
- 면적·층을 매물 데이터로 저장(선행 스펙의 "매물에 면적·원본 링크 저장"과 함께)
- 다른 앱(호갱노노, KB부동산) 화면 fixture 추가
- 시트를 열 때 워커를 미리 데워 두기(첫 인식 체감 단축). 측정에서 준비 시간이 길게 나오면 검토한다.
- 공유 시트로 이미지 받기(Web Share Target, PWA 필요)
- 자산 경로에 버전 넣기(`/ocr/7.0.0/`): 버전을 올릴 때 옛 HTTP 캐시가 남지 않게 한다
- `aria-live` 진행 문구를 10% 단위로 줄이기(화면 낭독 소음)

## 지금 하는 일

태스크 1 구현 완료. 리드가 브라우저에서 OCR 화면 확인 중

## 최근 결정

- [ADR-021 OCR은 tesseract.js 7.0.0 + kor best_int, 자산은 dist/ocr에 자체 호스팅](decisions/021-ocr-engine-assets.md): D1 A, D2 A. tesseract.js와 tesseract.js-core를 같은 정확한 버전(7.0.0)으로 직접 의존성에 고정. 자산 경로는 location.origin 기준 절대 URL, corePath는 디렉터리(끝 /). 복사 대상이 0건이면 빌드 실패. tesseract.js는 ocrSession.ts의 동적 import로만 들어와 메인 번들과 분리.
- [ADR-020 텍스트 붙여넣기를 스크린샷 OCR로 바꾼다](decisions/020-remove-paste.md): C. 텍스트 입력(textarea) 경로는 없애고 이미지 입력으로 바꾼다. 가격·면적 파서(parseKoreanPrice, parseListingShareText의 규칙)는 OCR 결과 텍스트에 재사용한다. 세부(라이브러리, 언어 데이터 위치, 화면)는 OCR 스펙과 후속 ADR에서 정한다.

## 사용자 확인 필요

- Cloudflare Worker 이름을 loan-calculator → mortgage-fit으로 변경(대시보드 Settings) 후 알려 주기 — 코드의 wrangler name과 맞춰야 배포됨
- 운영 Worker MOLIT_SERVICE_KEY를 Type=Secret으로 재등록(지금 503 notConfigured)
- U5: 네이버부동산 앱 매물 상세 화면 스크린샷 1~2장(개인정보 가림)
- U4: 10·15 FAQ 첨부 PDF로 서민·실수요자 60%(규제지역)와 1차 세 칸 대조

## 막힌 것

없음

## PR

[#2](https://github.com/hwanyoungChoi/loan-calculator/pull/2) 머지됨 · OCR PR은 태스크 후

<!-- spec: specs/screenshot-ocr.md -->

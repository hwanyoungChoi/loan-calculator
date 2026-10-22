# 주담대 계산기 2차: LTV 옵션과 매물 데이터 가져오기

> 상태: 진행 중 · 마지막 업데이트: 2026-10-22 10:51

## 태스크

- [x] 1. **LTV 옵션 엔드투엔드**(서민·실수요자 + 사용자 지정 LTV, 저장까지) — AC-1, AC-2, AC-3
- [x] 2. **실거래가 조회**(첫 서버 코드) — AC-4, AC-5, AC-6, AC-8 T1~T3
- [ ] 3. **붙여넣기 자동 채움** — AC-7, AC-8 T5 ← 진행 중 (tester)

## 지금 하는 일

태스크 3 구현·화면 확인 완료. tester가 통합 테스트 #8(가볍게) 작성 중. 다음: 커밋 → 최종 보고서 → PR

## 최근 결정

- [ADR-015 실거래가는 상세 자료 API, 응답은 JSON이 되면 JSON 아니면 fast-xml-parser](decisions/015-trade-api-format.md): A. 파서 이름은 parseTradesResponse(text). fixture는 **fixtures** 원문 파일로 두고 assumed/real을 구분하며, real fixture 통과를 AC-4 종결 조건으로 한다. 사용자 키가 오면 실제 응답 확인(2-3)을 서버 골격 직후로 당긴다. fast-xml-parser를 쓰면 parseTagValue false, item은 항상 배열, trim.
- [ADR-019 매물 링크 가져오기는 하지 않는다 (사이트가 자동 접근을 명시적으로 금지)](decisions/019-link-import-excluded.md): A. 매물 페이지 요청은 하지 않았다. C(우회)는 고려하지 않는다.
- [ADR-018 통합 테스트 상한을 8개 시나리오로 올린다 (ADR-008 개정)](decisions/018-integration-test-cap.md): A. 통합 테스트는 시나리오 8개, 시나리오당 it 1개. 상태 렌더링(로딩·빈·오류·행·더 보기)은 prop 기반 표시 컴포넌트, 오류 문구 매핑은 순수 함수로 빼서 단위 테스트한다.
- [ADR-017 실거래가와 붙여넣기는 계산 화면의 시트, 공통 Sheet 프레임, 조회 상태는 draft와 분리](decisions/017-trade-sheet.md): A. SaveSheet에서 공통 Sheet 프레임(backdrop·Esc·포커스 복귀·inert)을 먼저 추출하고 열린 시트는 useState<"save"|"paste"|"trades"|null> 하나로 관리. 시트는 히스토리에 넣지 않는다(저장 시트와 같음). 실거래가 조회 기억(시군구 코드)은 별도 키 loan-calculator/trade-lookup에 두고 draft는 customLtvRate만 늘린다. 단지명 필터는 시트의 제출된 파라미터 상태이고 새 계산·매물 열기에서 비운다. 붙여넣기 적용은 새 매물 계산으로 보고 kbPrice를 비우고 listingId를 해제한다. 미리보기는 입력 즉시 갱신.
- [ADR-016 법정동코드는 정적 시군구 목록, 서버도 같은 목록으로 검증](decisions/016-lawd-codes.md): A. src/lib/constants/lawdCodes.ts 한 파일을 클라이언트와 서버가 함께 쓴다(서버는 상대 경로 import). 2-3 스모크에 화성시·동탄구 등 최근 개편 지역을 넣는다.
- [ADR-014 클라이언트 HTTP는 react-query + fetch 래퍼, 자동 재시도 없음 (ADR-003 개정)](decisions/014-client-http.md): A. CONVENTIONS의 "모든 API 요청은 react-query 훅" 규칙을 따른다. lib/api/client.ts는 fetch 래퍼 apiClient.get<T>(path, { params }), lib/api/queryClient.ts에 QueryClient. 쿼리 키 aptTradeListQueryKey(params) → ["aptTrade","list",params]. retry: false, staleTime 10분. useAptTrades는 실거래가 시트 안에서만 호출. axios는 넣지 않는다. ADR-003의 "react-query 미사용"은 이 결정으로 대체.
- [ADR-013 LTV 옵션 계산 규칙: 서민·실수요자는 5번째 보유 상태, 요건 미충족은 ineligible, 사용자 지정도 한도 상한은 유지](decisions/013-ltv-option-rules.md): 보유 상태에 noHomePreferred(무주택·서민실수요자) 추가. 우선순위: ① 사용자 지정 LTV가 있으면 그 값(source custom) ② 서민·실수요자인데 판정 가격 max(매매가, KB시세)가 8억 초과면 ineligible ③ 셀이 null이면 unconfirmed ④ 규제 LTV. 한도 상한은 사용자 지정에도 적용(상한 없는 비수도권에서는 "상한 적용" 문구를 쓰지 않는다). 사용자 지정일 때 병기하는 규제 기준값은 같은 우선순위로 구한 값이고, ineligible·unconfirmed면 그 상태 문구를 병기한다. 요약 바에 "요건 미충족"·"사용자 지정 LTV n%" 표시. "새 계산"은 사용자 지정 LTV를 끈다. 소득·세대주는 앱이 확인하지 않는다는 문구를 결과 카드에 둔다.
- [ADR-012 사용자 지정 LTV는 선택 필드 customLtvRate?로 저장한다 (ADR-001 보강)](decisions/012-custom-ltv-storage.md): A. "키 없음 = 규제 LTV". 판정은 typeof === "number" 하나로 하고 null은 저장하지 않는다. 검증은 typeof → 정수 → 0~100. 규제로 되돌려 저장하면 키를 지운다. ADR-001 보강: 저장 형식 변경은 선택 필드·enum 값 추가로만 하고, 롤백 시 옛 코드가 새 enum을 corrupt로 판정할 수 있음을 받아들인다(데이터 소실 아님, 원문 복사 가능).
- [ADR-011 서버는 Cloudflare Pages Functions, 호출 증폭은 캐시와 입력 검증으로 막는다](decisions/011-server-pages-functions.md): A. 진입점 functions/api/apt-trades.ts는 얇게, 로직은 server/aptTrades/*(상대 경로 import, PagesFunction 타입 비의존). 업스트림 달 단위 응답은 Cache API로 캐시(키에 서비스키·aptName 제외), lawdCd는 LAWD_CODES에 있는 값만, 성공 응답 Cache-Control public max-age=600·오류 no-store. 요청 전체에 타임아웃 신호 하나, 예상 못 한 예외는 500 internal JSON. 오류 매핑: 22 quotaExceeded·23 rateLimited 분리, 20/30/31 → 503 notConfigured. 2-1 직후 Pages 미리보기에서 Cloudflare IP로 업스트림이 호출되는지 먼저 확인한다.

## 사용자 확인 필요

- U1: 로컬 키는 등록됨. Cloudflare Pages 시크릿 MOLIT_SERVICE_KEY(Production·Preview) 등록과 Pages 저장소 연결은 직접 필요
- U3: 네이버부동산 공유 텍스트 실제 샘플 2~3개(매매 2, 전세 1)
- U4: 10·15 FAQ 첨부 PDF로 서민·실수요자 60%(규제지역)와 1차 U2 세 칸 대조
- 제안: 매물에 원본 링크만 저장해 눌러서 여는 기능(서버 요청 없음) — 원하면 태스크 3에 추가

## 막힌 것

없음

## PR

아직 없음

<!-- spec: specs/ltv-options-and-import.md -->

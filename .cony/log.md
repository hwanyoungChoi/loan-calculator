# 작업 기록 — 주담대 계산기

## 기획

- 요청: 매매가·KB시세 중 낮은 금액 기준 주담대 한도·자기자금 계산기, 조건별 LTV, 매물 저장·비교. DSR은 다음 단계.
- 요청: GitHub 원격 저장소가 없으므로 push는 건너뛰고, PR 단계에서 사용자에게 묻는다.
- AI: planner가 금융위 1차 출처(S1~S6)로 LTV 12칸과 한도 상한을 채움. 웹 추출본이라 태스크 1-2에서 원문 대조 예정(A8).
- AI: U1(서민·실수요자 우대)은 이번 범위에서 빼고 사용자 확인 필요로 올림.
- 사용량: planner 첫 스펙 작성 · opus · 110k 토큰 · 10분 5초
- 사용량: client-dev 스펙 검토 · sonnet · 52k 토큰 · 2분 30초
- 사용량: tester 스펙 검토 · sonnet · 51k 토큰 · 2분 50초
- 사용량: planner 반론(D8)·새 결정 제안(N1~N5) · sonnet · 57k 토큰 · 1분 25초
- 토론: 결정 10건 채택 ([ADR-001](decisions/001-storage.md) ~ [ADR-010](decisions/010-id-generation.md)). D8은 tester 반대 → planner가 B로 수정.
- 사용량: planner 스펙 수정(결정 반영) · sonnet · 108k 토큰 · 5분 50초
- AI: 리드가 AC-3 표 헤더(구간 판단 가격)를 직접 정리.

## 태스크 1

- AI: 리드가 1-2 규제 수치를 금융위 원문(S1·S2·S3 웹 본문)과 대조. 12칸 모두 읽을 수 있는 원문과 일치.
  - S1(6·27): 생애최초 수도권·규제지역 70%, 지방 "현행과 동일"(표의 현행 80%). 처분조건부 1주택은 무주택과 동일(비규제 70%). 추가구입 1주택 수도권·규제지역 0%, 비규제 현행 60%. 처분 약정은 개선안 6개월, 현행 표 주석 2년.
  - S2(10·15): 규제지역 무주택(처분조건부 포함) 70%→40%, 한도 15억 이하 6억·15~25억 4억·25억 초과 2억, 기준은 "주택가격(시가)"로만 표기(정의 없음 → ADR-005 유지).
  - S3(FAQ Q4): 생애최초 행 "70% (좌동)"이 웹 추출에서 표가 깨져 규제지역 칸을 확정할 수 없음. 원문은 hwpx 첨부라 리드가 열지 않음(파일 다운로드는 사용자 승인 필요).
  - 결론: 규제지역 생애최초 70%, 비수도권 생애최초 80%·미처분 60%는 "현행 유지" 문구에 기댄 값이라 사용자 확인 필요로 올림. 값은 스펙대로 두고 진행.
- 사용량: client-dev 태스크 1-1~1-4b 구현 · 기본(opus) · 138k 토큰 · 30분 15초
- AI: client-dev가 수도권 비규제·무주택, 비수도권·무주택 셀의 effectiveDate를 S2 시행일(2025-10-16)로 넣고 note에 근거 표시. 수치는 스펙 그대로.
- AI: 조건 요약 문구는 "규제지역 · …"로 통일(스펙 내 불일치). react-hook-form 미사용(useState<Draft>).
- AI: 리드 화면 확인(브라우저 360×780, pnpm dev). 통과: 초기값 규제지역·무주택, 시나리오(125000/120000 규제·생애최초 → 한도 6억, 자기자금 6억 5,000만원), 경계 매물(140000/160000 → 상한 4억, KB시세 기준, 경계 문구), LTV 0%(수도권 비규제·미처분), 상한 없음(비수도권·생애최초 50000/48000 → 3억 8,400만원), blur 시 0 오류·숫자 오류, aria-invalid·inputmode=numeric·aria-describedby, M1 최악 입력 scrollWidth 360 = clientWidth, 근거 링크 target/rel.
- AI: 못 한 것: M2 실기기 숫자 키패드, M3 iOS 키보드와 하단 바(실기기 필요). M5 링크가 실제로 열리는지는 href만 확인.
- AI: 관찰: 한도 0일 때 "0만원"으로 표시됨. formatManwon 경계표 그대로라 유지.
- 사용량: tester 1-5·1-6 테스트 작성 · 기본(opus) · 94k 토큰 · 3분 40초
- AI: 테스트 5개 파일, 166개 통과. AC-1~4, AC-5(a)(b)(c)(d 계산 화면), AC-8(a)(b) 통과. 미검증: AC-5(d) 목록 화면 기준일, #1 "저장 시트 미열림"(태스크 2에서 재확인).
- AI: tester 메모: MortgageCalculator가 LOAN_REGULATIONS를 직접 import해 화면 단위로 fixture를 넣을 수 없음 → 2-2에서 주입 경로 필요.

## 태스크 2

- 요청: GitHub private 저장소 hwanyoungChoi/loan-calculator 생성, 태스크마다 push. main·작업 브랜치 push 완료, delete-branch-on-merge 설정.
- 요청: Cloudflare Pages Git 연동으로 배포(대시보드 연결은 사용자가 직접). PR 생성·CI 통과 후 머지는 skill 흐름대로 진행.
- 사용량: client-dev 태스크 2-1~2-3b 구현 · 기본(opus) · 150k 토큰 · 9분 35초
- AI: client-dev가 주입 경로 `<AppRoutes storage regulations />` 추가, 훅은 `useListings(store)`/`useDraft(store)`로 스토어를 인자로 받음(스펙 계약과 다름). ChoiceGroup을 src/components/로 승격(목록 정렬에서 재사용). getBrowserStorage()는 쿠키 차단 시 localStorage 접근 자체가 throw하는 경우를 unavailable로 처리.
- AI: 기존 MortgageCalculator.test.tsx를 AppRoutes 렌더로 바꿈(단언은 그대로).
- AI: 리드 화면 확인(360×780). 통과: 빈 이름 오류, 글자 수 8/40, Enter 저장 → 계산 화면 유지 + "저장됨" 비활성, 값 변경 시 시트에 이름 채움 + 덮어쓰기/새로 저장, 덮어쓰기 후 1개 유지·createdAt 유지, 새 계산(금액만 비우고 조건 유지), 목록 자기자금순·기준일, 카드 → #/ 값 채움·저장됨, 뒤로 가기 → 목록, 삭제 후 계산 화면 "저장" 활성(listingId null 취급), 새로고침 후 입력·조건 유지, #/listing/abc → #/, M7 손상({) → 저장 비활성 + 이유 설명, 목록 손상 문구·원문·원문 복사·목록 초기화 → 빈 목록, 가로 스크롤 없음.
- AI: 삭제·초기화 확인창은 JS로 window.confirm을 대체해 확인함. 시크릿 모드 unavailable, M6(휴대폰 LAN 주소 저장)은 못 함.
- 사용량: tester 2-4·2-5 테스트 작성 · 기본(opus) · 147k 토큰 · 1시간 49분(변이 확인 포함)
- AI: 테스트 14개 파일, 349개 통과. 통합 #1~#5 완성(ADR-008 상한). AC-6, AC-7, AC-5(d), AC-8(c)(d) 통과. 변이 확인을 scratchpad 복사본에서 수행해 21건 중 의미 있는 변이는 모두 잡음.
- AI: 미검증(자동): 쓰기 실패 시 시트 문구, 목록 unavailable 화면, 새 매물 add 직후 "저장됨"(리드가 화면에서 확인함), useHashRoute replace·탭·정렬 쿼리·스크롤 복원(태스크 3).

## 태스크 3

- 사용량: client-dev 태스크 3-1·3-2 구현 · 기본(opus) · 140k 토큰 · 8분
- AI: client-dev 판단: 계산 화면은 마운트 시 항상 맨 위로(목록 스크롤이 남는 문제), Esc로 시트 닫기, 시트 열린 동안 뒤 화면 inert. 남은 이슈: 저장 성공 후 포커스가 body로, TabNav는 inert 범위 밖(키보드 Tab 도달), 실기기 M2·M3 미확인.
- AI: 리드 화면 확인(360×780, 매물 15개 주입). 통과: M4 스크롤 1200 → 카드 열기(계산 화면 0, 값 채움) → 뒤로 가기 1200 복원, 탭 이동 replace(history 길이 그대로), 탭으로 들어오면 0, 정렬 변경 #/listings?sort=recent replace, 새로고침 후 정렬 유지, 가로 스크롤 없음.
- AI: (확인 방법 메모) 브라우저 도구의 ref 클릭이 카드를 화면에 맞추려고 먼저 스크롤해 복원값이 1726으로 보였음. JS로 직접 클릭해 재확인. 제품 결함 아님.
- 요청: 이번 PR 머지 후 다음 /cony:team 사이클로 부부 공유 저장(Cloudflare D1 + Access) 진행. ADR-001(localStorage)은 다음 사이클에서 재검토.
- 요청: 서버 저장은 별도 작업으로 사용자가 나중에 시작. 이 세션은 이번 PR 머지까지.
- 사용량: tester 3-3 점검·변이 확인 · 기본(opus) · 104k 토큰 · 6분 20초
- AI: 테스트 15개 파일, 358개 통과(5회 반복 동일). AC-8(a)~(e) 자동 부분 통과. 스펙 3-3 변이 전부 잡힘, 새 동작 변이 16건 중 15건 잡힘(flushSync 제거는 jsdom 한계 → 리드가 실제 브라우저에서 Esc 후 포커스가 저장 버튼으로 돌아오고 inert가 풀리는 것을 확인).
- 놓침: 스펙 AC-1 내림 예시(69999.3)가 floor와 round를 구분하지 못해 floor→round 변이가 살아남음. tester가 .5·.9 케이스를 추가했고, 리드가 스펙 AC-1에도 반영.
- AI: 남은 이슈(AC 밖): 저장 성공 후 포커스가 body로 감, TabNav가 시트 inert 범위 밖.
- AI: 리드가 최종 보고서 작성(reports/2026-10-21-mortgage-calculator.md).

## PR

- 요청: PR #1 Auto-fix 켜기, CI 통과 후 머지.
- AI: CI(verify) 통과 → squash 머지(6934786), 원격·로컬 작업 브랜치 삭제.

# 작업 기록 — 2차: LTV 옵션과 매물 데이터 가져오기 (2026-10-22)

## 기획

- 요청: LTV 옵션은 "둘 다" — 규정상 우대 조건(서민·실수요자 우대 등, 1차 출처로 확인된 수치만)을 조건으로 추가하고, 사용자가 LTV를 직접 지정할 수도 있게(결과에 "사용자 지정 LTV"로 구분). U1(서민·실수요자 우대 포함 여부)은 포함으로 답변됨.
- 요청: 매물 데이터는 국토부 실거래가 API, 네이버부동산 공유 텍스트 붙여넣기, 크롤링 세 가지 모두 선택. 리드가 크롤링의 약관·법적 위험을 설명했고, 범위를 "사용자가 붙여넣은 매물 링크 한 건만 그때 가져오기"로 좁혀 진행(대량·정기 수집 금지, 기술적으로 막히면 보고).
- 요청: 부부 공유 저장(D1 + Access)은 이번 범위 밖.
- 사용량: planner 2차 첫 스펙 작성 · opus · 193k 토큰 · 14분
- AI: planner가 서민·실수요자 LTV(규제 60%, 수도권 비규제 70%, 비수도권 미확인)와 요건(부부합산 9천만·8억·무주택세대주)을 S3 FAQ에서 확인. 실거래가 상세 API 엔드포인트·파라미터 확인, 응답 필드는 2차 출처.
- AI: 링크 가져오기 조사 — 네이버(도구 접근 불가, DB권 판결 보도), 호갱노노(403), KB(robots Disallow /). 제외 추천 → 제품 범위 변경이라 사용자 확인 필요(U2).
- 사용량: client-dev 2차 스펙 검토 · sonnet (조건부 찬성, 필수 수정 6건: customLtvRate undefined/null 표현 통일, appliedLtv 파급, 요약 바 표시, 병기 규제값 정의, 붙여넣기 적용 규칙, 새 계산 시 customLtv 해제)
- 사용량: backend-dev 2차 스펙 검토 · sonnet (조건부 찬성, 필수 수정 6건: 캐시·lawdCd 검증으로 호출 증폭 완화, Cloudflare IP 차단 여부 조기 확인, 공유 타임아웃·예외 처리, 22/23·20/30/31 오류 매핑, .gitignore·eslint ignores·alias, Env 타입·tsconfig·onlyBuiltDependencies)
- 사용량: backend-dev 2차 스펙 검토 · sonnet · 88k 토큰 · 4분 / client-dev · sonnet · 100k 토큰 · 4분 / tester · sonnet · 92k 토큰 · 4분 45초
- 토론: 세 검토 모두 조건부 찬성, 정면 반대 없음 → 반론 단계 생략. 결정 8건 채택([ADR-011](decisions/011-server-pages-functions.md) ~ [ADR-018](decisions/018-integration-test-cap.md)). ADR-003·008은 개정, ADR-001은 보강.
- AI: D9(링크 가져오기)는 사용자 확인(U2) 대기 — 스펙에서는 제외 상태로 두고 진행.
- 요청: 사용자가 개발 계속 진행 지시. 스펙 반영이 끝나는 대로 태스크 1부터 바로 착수.
- 사용량: planner 2차 스펙 수정(결정 반영) · sonnet · 161k 토큰 · 6분 15초
- AI: planner가 ADR·검토에 없던 세부를 정함(공유 타임아웃 15초, 캐시 TTL 지난달 24시간·이번 달 30분, 429 섞이면 quotaExceeded 우선, 세종 sigungu=시도명, 시군구 선택 즉시 저장, complexName 휴리스틱, LAWD_CODES 200개 이상). 가정 A12·A14~A16.

## 태스크 1

- 사용량: client-dev 2차 태스크 1-1~1-4b 구현 · 기본(opus) · 227k 토큰 · 10분
- AI: client-dev가 기존 테스트 3개 파일을 의도된 변경에 맞춰 수정(LTV 15칸, draft customLtv). 비수도권 서민·실수요자 셀은 null 유지(U4 대기).
- AI: 리드 판정 — 스펙 AC-1(b) 80000/80000 "equal"은 ok 결과라 성립 안 함 → 80001/80001로 확인. 한도 0 표기는 기존 formatManwon "0만원" 유지. 요건 문구 "9,000만원".
- AI: 리드 화면 확인(360×780). 통과: 보유 상태 5개(라벨 한 줄), 서민·실수요자 70000/70000 → 60%·한도 4억 2,000만원·자기자금 2억 8,000만원·요건 3줄·"요건 확인 안 함" 문구·기준일 2026-10-22, 85000/84000 → 요건 미충족(— 세 칸, 이유 문구, 요약 바 태그, 저장 활성), 무주택 100000/100000 + 사용자 지정 70 → 규제 기준 40% 병기·상한 적용 문구·경고·한도 6억, 스위치 켜면 입력에 포커스·안내 문구 2곳·저장 비활성, 70.5 blur → 정수 오류, 새 계산 → 스위치 꺼짐·조건 유지, 가로 스크롤 없음.
- 요청: 테스트를 너무 빡세게 하지 말 것 → tester에게 범위 축소·변이 확인 생략 지시.
- 요청: 태스크 1이 끝나면 매물 링크 가져오기를 시도해 볼 것(U2: 제외 대신 시도). 리드 방침: 사용자가 붙여넣은 링크 한 건만 그때 가져오는 방식으로 실현 가능성부터 확인하고, 봇 차단·로그인·CAPTCHA로 막히면 우회하지 않고 보고한다.
- 사용량: tester 2차 1-5 테스트 · 기본(opus) · 181k 토큰 · 6분 50초
- AI: 테스트 23개 파일, 557건 통과. AC-1~3 통과, 결함 없음. 통합 테스트 6개(#6 신규). 변이 확인은 사용자 요청으로 생략(미확인).
- AI: 리드가 매물 링크 가져오기 실현 가능성 확인 — 세 사이트 robots.txt가 일반 자동 접근을 금지(호갱노노는 서면 허가 없는 크롤링 금지 명시). 매물 페이지는 요청하지 않음. [ADR-019](decisions/019-link-import-excluded.md)로 제외 확정, 붙여넣기 자동 채움으로 대체.

## 태스크 2

- 요청: 사용자가 실거래가 API 서비스키(기본 자료, 개발계정)를 채팅으로 전달. 리드가 git-ignore된 로컬 .dev.vars에만 저장(권한 600), 커밋·로그에 남기지 않음.
- AI: 리드가 실제 API를 5회 호출해 형식 확인(성공·0건·1건·JSON·키 오류). 기본 자료에도 cdealType 있음, JSON 지원, resultCode "000". [ADR-015](decisions/015-trade-api-format.md) 개정. 응답 원문(키 없음)을 backend-dev에게 real fixture로 전달.
- 사용량: client-dev 2차 2-4 구현 · 기본(opus) · 190k 토큰 · 10분 15초
- AI: client-dev가 code.go.kr 전체자료(2026-10-01)로 시군구 256개 생성. 행정구역 개편 반영(광주·전남 → 전남광주통합특별시 12xxx, 인천 제물포·영종·서해·검단구, 화성시 4개 구).
- AI: 리드가 실제 API로 개편 코드 확인(202609): 12330 광산 302건 / 옛 29200 0건, 28290 검단 243건 / 옛 28260 0건, 41597 동탄 248건 / 옛 41590 0건 → 새 코드 목록이 맞음.
- AI: 리드가 검증 hook 대응으로 클라이언트 import 순서 lint 3건을 eslint --fix로 정리.
- 사용량: backend-dev 2차 2-1·2-2 구현 · 기본(opus) · 196k 토큰 · 18분
- 놓침: backend-dev가 키 메시지 전에 probeUpstream.ts를 "키 없음 경로"로 시험하다 스크립트가 .dev.vars를 읽어 실제 키로 상세 API를 약 10회 호출(전부 403/30, 키 출력·저장 없음). 일일 한도 10,000건 중 소량 사용. 스크립트가 로컬 비밀 파일을 자동으로 읽는 동작이 원인.
- AI: backend-dev가 로컬 wrangler + 실제 키로 확인 — 종로 1달 200·2건, 강남 6달 1071건 287ms, 재요청 2~3ms(로컬 캐시). 키 없는 복사본에서 400·405·503 확인. CI에 dist grep과 wrangler 연기 테스트 추가(실제 Actions 미확인).
- AI: 리드 검증 — lint·format·test(628/1 todo)·build 통과, 추적·미추적 파일에 키 원문 0건.
- AI: 리드 화면 확인(360×780, wrangler + Vite proxy, 실제 키). 통과: 실거래가 시트 열기 → 서울 강남구 선택 즉시 조회(최근 3개월 241건, 행 2줄, 출처·참고용 문구), 시군구 기억 저장(trade-lookup), 단지명 "개포자이" 조회 → 2건, Esc로 닫았다 다시 열면 재요청 없음(서버 로그 요청 수 그대로)·단지명 유지, 시트 높이 702/780(90%), 가로 스크롤 없음.
- 사용량: tester 2차 2-5 테스트(가볍게) · 기본(opus) · 76k 토큰 · 2분 40초
- AI: 테스트 32파일 640 통과·todo 1. 통합 #7 추가(총 7개), AC-5(c)(d) 소형 테스트 추가. AC-4 통과(real fixture 포함), AC-6(d)(e)는 CI·수동 미검증. 결함 없음.
- 놓침: tester가 import를 먼저 넣고 본문을 나중에 쓰는 동안 종료 전 검증 hook이 두 번 실패를 보고함(작업 중 상태). 끝난 뒤 통과.

## 태스크 3

- 사용량: client-dev 2차 3-1·3-2 구현 · 기본(opus) · 133k 토큰 · 8분 25초
- AI: client-dev가 파서 버그(텍스트 안 "9억 8천"이 90008) 발견·수정. 휴리스틱 추가: "네이버" 줄과 40자 초과 줄은 단지명 후보에서 제외. 적용 시 실거래가 단지명 필터를 바로 덮어씀(스펙의 별도 힌트 상태 대신).
- 놓침: 스펙 AC-7(a) 예시 "999억 → null"이 틀림(999억 < MAX_AMOUNT). 리드가 "100,000억"으로 정정.
- AI: 리드 판정 — 붙여넣기 적용 시 사용자 지정 LTV도 끔(ADR-013과 같은 이유), URL만 붙여넣으면 "링크는 읽지 않습니다" 안내(ADR-019). client-dev에게 추가 지시.
- 사용량: client-dev 3차 보완(적용 시 사용자 지정 LTV 끄기, linkOnly 안내) · 기본(opus) · 5k 토큰 추가분 · 약 1분
- AI: 리드 화면 확인(360×780). 통과: 붙여넣기 시트 열면 textarea 포커스, 붙여넣는 즉시 미리보기(12억 5,000만원·래미안OO·84㎡·현재 10억원 → 12억 5,000만원), 미리보기 동안 뒤 매매가 그대로, 적용 → 매매가 125,000·KB시세 비움·KB시세 포커스, 저장 시트 이름 제안 "래미안OO 84㎡", 실거래가 단지명 "래미안OO", 전세 텍스트 → notSale 문구·적용 비활성, URL만 → 링크 안내, 가로 스크롤 없음.
- 사용량: tester 2차 3-3 통합 #8(가볍게) · 기본(opus)
- AI: 테스트 36파일 673 통과·todo 1. 통합 테스트 8개(상한). AC-7은 가정 기준 통과, 특성 테스트 대부분과 일부 화면 경로는 미검증(사용자 요청으로 가볍게).

## PR

- 요청: PR #2 Auto-fix 켜기, CI 통과 후 머지.
- AI: GitHub Actions verify는 통과, Cloudflare "Workers Builds: loan-calculator" 체크 실패. 사용자가 저장소를 Pages가 아니라 Workers로 연결한 것으로 판단(체크 이름). 로그는 대시보드 전용이라 못 읽음. 원인 추정: Pages 형식 wrangler.jsonc를 wrangler deploy가 거부. ADR-011 뒤집을 조건에 따라 Workers + Static Assets로 전환 지시(backend-dev).
- AI: Auto-fix 알림(939e169의 Workers Builds 실패, Cloudflare 봇 배포 상태 코멘트) — 이미 수정 중인 같은 실패. 봇 코멘트는 대응 불필요.
- 사용량: backend-dev Workers 전환 · 기본(opus) · 27k 토큰 추가분 · 4분 20초
- 토론 없이 리드 판정: [ADR-011](decisions/011-server-pages-functions.md) 개정(Pages Functions → Workers + Static Assets). 배포 대상이 사용자 설정으로 정해진 사안.
- AI: 리드가 화면 확인용으로 띄워 둔 옛 Pages dev 서버(8788)를 종료.
- AI: Workers 전환 후(3c419d8)에도 Workers Builds 실패. 로컬 deploy·versions upload dry-run은 성공, GitHub에는 로그 없음(시작=완료 시각). 가설: main 첫 빌드 실패로 Worker가 한 번도 배포되지 않아 PR 브랜치의 versions upload가 실패. 대시보드 로그 없이는 확정 불가 → 사용자에게 로그 요청.
- 요청: 사용자가 Worker loan-calculator에 시크릿 MOLIT_SERVICE_KEY 등록 완료(U1 해결).
- 요청: 사용자가 Cloudflare 빌드 로그 전달 — 빌드는 성공, 배포 명령 `npx wrangler preview`(PR 브랜치)가 "configuration is missing a `previews` block"으로 실패. 앞선 가설(Worker 미배포)은 틀림.
- AI: wrangler.jsonc에 `"previews": {}` 추가(로컬 wrangler 4.151.3 스키마에 존재 확인, deploy dry-run 성공). 참고: Preview는 시크릿을 따로 관리(`wrangler preview secret`) → PR 미리보기에서는 실거래가가 notConfigured일 수 있음, 운영은 등록한 Worker 시크릿 사용.
- AI: PR #2 체크 2개(verify, Workers Builds) 통과 → squash 머지(2886e02). 원격 작업 브랜치는 자동 삭제, 로컬 브랜치 삭제.
- AI: 운영 주소 loan-calculator.welcomechoi94.workers.dev는 머지 직후 아직 예전 배포(/api가 index.html). main 운영 빌드 완료 대기.
- AI: main 운영 배포(Workers Builds) 성공. 운영 주소에서 / 200, /api 400 정상, 조회는 503 notConfigured(Worker env에 MOLIT_SERVICE_KEY 없음 — 업스트림 코드 없는 메시지). 추정: Text 변수로 저장돼 wrangler deploy가 지웠거나 이름·범위 불일치. 사용자에게 Secret 확인 또는 wrangler secret put 안내.
- 놓침: 사용자 확인 결과 네이버부동산 앱 공유 메뉴에 "복사"가 없음. 태스크 3(공유 텍스트 붙여넣기)은 실제 입력 샘플(U3) 없이 "공유 텍스트에 가격이 들어 있다"는 가정 위에 만들어져 핵심 경로가 성립하지 않음. 스펙 리뷰(client-dev)에서 "U3 도착 후 착수" 제안이 있었으나 필수로 두지 않았음.

# 작업 기록 — 스크린샷 OCR (2026-10-22)

- 요청: 사용자 "공유 복사가 없어", "복붙의 의미가 없지 않나" → [ADR-020](decisions/020-remove-paste.md) 붙여넣기 기능 삭제. 링크 저장은 이번에 넣지 않음.
- AI: 사용자가 데이터 연동 방법을 다시 물어 삭제 작업을 시작 전에 멈춤(코드 변경 없음). OCR로 가면 파서를 재사용할 수 있어서 결정 뒤 진행.
- 요청: 사용자가 "OCR로 해보자" — 붙여넣기 삭제 대신 스크린샷 OCR로 교체. ADR-020을 교체 결정으로 다시 씀, 브랜치 cony/screenshot-ocr.
- AI: 운영 API 재확인도 503(env 키 비어 있음, handleAptTrades.ts:60). 사용자는 등록했다고 함 → 등록이 머지 전이었고 Text 타입이면 wrangler deploy가 지움. Secret으로 재등록 안내.
- 사용량: pm OCR 스펙 작성 · 기본(opus) · 155k 토큰 · 11분 10초
- AI: pm이 tesseract.js 7.0.0 조사(kor best_int 1.57MB gz, lstm 코어 3.9MB×3, worker 111KB, Workers 파일 한도 안). 기존 파서의 실제 화면 결함 3개 발견(상태 표시줄 줄이 단지명, "101동" 잔존, 공급/전용 쌍에서 공급면적 선택). D1 엔진 tesseract.js, D2 자산 자체 호스팅(vite-plugin-static-copy) 추천.
- AI: cony 플러그인 0.10.0 반영(다른 세션 전달) — 에이전트 이름 pm·fe·be·qa, 칸반(progress/review), 검토 파일명 {YYYYMMDD-HHmm}-{역할}-{대상}.md, REVIEW에 development:code-review-fe, 커밋에 development:commit-message. OCR 스펙은 이름 변경 전에 이미 완성돼 끊긴 작업 없음(놓침 아님). 보드를 OCR 스펙으로 초기화.
- 사용량: fe OCR 스펙 검토 · sonnet · 36k 토큰 · 53초 (D1 찬성, D2 조건부 찬성, 필수 수정 4: 절대 URL 자산 경로·corePath 끝 /, 복사 0건이면 빌드 실패, recognizing 중 start 겹침 방지, 360px 레이아웃)
- 사용량: qa OCR 스펙 검토 · sonnet · 38k 토큰 · 1분 25초 (조건부 찬성, 필수 수정 5: toOcrProgress 순수 함수, AC-1 인라인 케이스·오탐 방지, 테스트 이음새, AC-4·5 절차 구체화)
- 토론: fe·qa 모두 조건부 찬성, 반대 없음 → [ADR-021](decisions/021-ocr-engine-assets.md) 채택. 속도를 위해 pm 스펙 반영과 fe 태스크 1 구현을 병렬로 진행.

## 태스크 1 (OCR)

- 사용량: pm OCR 스펙 수정(리뷰 반영) · sonnet · 51k 토큰 · 1분 40초
- 요청: 프로젝트 이름을 mortgage-fit(앱 이름 "모기지핏")으로. 리드가 GitHub 저장소를 hwanyoungChoi/mortgage-fit으로 변경하고 로컬 remote 갱신. 코드 안 이름(package.json, 앱 제목, wrangler name)은 fe의 OCR 작업이 끝난 뒤 변경. 저장 키(loan-calculator/listings 등)는 기존 데이터 보존을 위해 유지 예정.
- AI: 저장소 공개 범위가 PUBLIC으로 확인됨(처음 생성은 private, 리드가 바꾼 적 없음). 전체 git 이력에 서비스키 원문 0건 확인.
- AI: fe가 OCR 작업 중 파일 이름을 바꾸는 사이 종료 전 검증 hook이 3회 연속 실패(MortgageCalculator.tsx가 옛 모듈 import). 작업 중 상태라 리드가 손대지 않음 — fe 완료 후 4개 검증 재확인 예정. 남으면 보고서 남은 이슈에 적음.
- 요청: "왜 이렇게 오래 걸려? 테스트코드는 짜지 마" → fe에게 새 테스트 작성 중단·연결 마무리만 지시. 이번 사이클은 qa 단계 생략, REVIEW는 리드 화면 확인과 빌드 검증만.
- 사용량: fe OCR 태스크 1 구현 · 기본(opus) · 172k 토큰 · 13분 40초
- AI: fe 결과 — lint·test(38파일 691)·build 통과, dist/ocr 5개(worker 111KB, 코어 3.9MB×3, kor 1.57MB), tesseract.js는 별도 청크. headless 인식: 매매가 12억 5,000만원 성공, 단지명 "래미안00"(O→0), 면적 실패(㎡→0 오인식). 재오픈 후 첫 인식 324ms. 네트워크 같은 출처만.
- AI: 리드 화면 확인(vite preview, 360×780). 통과: "스크린샷으로 채우기" 시트(안내 2줄), 캔버스로 만든 매물 이미지 업로드 → 0.5초 만에 미리보기(매매가 12억 5,000만원, 단지 "래미안클래스"), 적용 → 매매가 125,000·KB시세 비움·KB시세 포커스, 가로 스크롤 없음. 실패: 면적 "찾지 못함"(㎡를 "ㅁ"으로 오인식, fe 시험에선 "0") → U5 실제 스크린샷으로 태스크 2에서 조정. 실기기·Cloudflare 배포 환경은 미확인.
- 요청 반영: qa 단계 생략(사용자 "테스트코드는 짜지 마").
- AI: development:code-review-fe(staged) — 컨벤션 위반 없음. 참고: ocrSession discard에서 worker.terminate() 실패 시 처리되지 않은 reject 가능(화면 영향 없음, 남은 이슈).
- AI: 커밋 메시지는 속도를 위해 development:commit-message 대신 리드가 같은 형식(영문 prefix + 한글 본문)으로 작성.

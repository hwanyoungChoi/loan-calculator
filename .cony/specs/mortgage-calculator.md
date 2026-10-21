# 주담대 한도·자기자금 계산기

작성일: 2026-10-21 · 브랜치: `cony/mortgage-calculator`

## 목표

매물을 보는 자리에서 매매가와 KB시세만 입력하면 담보 기준(둘 중 낮은 금액)에 LTV와 한도 상한을 적용한 주담대 예상 한도와 필요한 자기자금을 바로 보여준다. 여러 매물을 저장해 두고 필요한 자기자금 기준으로 비교할 수 있게 한다. 모바일 우선이다.

## 사용자 시나리오

1. 매물 현장에서 휴대폰으로 앱을 연다. 매매가 `125000`(만원)과 KB시세 `120000`을 입력하고, 주택 소재지 "규제지역", 보유 상태 "무주택·생애최초"를 고른다. (처음 열면 규제지역·무주택이 선택돼 있다.)
2. 결과 카드 상단에 조건 요약("규제지역 · 무주택·생애최초")이 보이고, 담보 기준 12억(KB시세), LTV 70%, LTV 금액 8억 4,000만, 한도 상한 6억(구간 기준 가격 12억 5,000만원(매매가), 15억 이하 구간), **예상 한도 6억**, **필요한 자기자금(부대비용 제외) 6억 5,000만**이 나온다. 그 아래에 "규제 기준일 2026-10-21"과 근거 출처 링크가 보인다.
3. "저장"을 누르고 매물 이름("래미안 101동")을 입력해 저장한다. 계산 화면에 그대로 머물고 저장 버튼은 "저장됨"으로 바뀐다.
4. "새 계산"을 눌러 금액을 비우고 다른 매물 2곳도 같은 방식으로 저장한다.
5. "저장 목록" 화면에서 세 매물을 필요한 자기자금이 적은 순으로 본다. 한 곳을 눌러 계산 화면으로 불러온 뒤 KB시세를 고치면 "저장"이 다시 활성화되고, 시트에서 "덮어쓰기"를 고른다. 필요 없는 매물은 삭제한다.
6. 다음 날 앱을 다시 열어도 저장 목록이 그대로 있고, 어제 입력하던 값도 계산 화면에 남아 있다.

## 참고한 사례

- **금융위원회 「10.15 대책 관련 FAQ」 Q4 표** ([fsc.go.kr/po020201/85466](https://fsc.go.kr/po020201/85466)): 차주 유형(일반 무주택, 생애최초, 서민·실수요자)을 행으로, 비규제/규제지역을 열로 두고 LTV와 최대한도를 한 표에 정리한다. 규제 데이터 파일을 같은 "차주 유형 × 지역" 행렬로 만든다. 셀마다 출처와 시행일을 붙인다.
- **뱅크몰 아파트별 주담대 리포트** ([bank-mall.co.kr/plus/blog/12619](https://www.bank-mall.co.kr/plus/blog/12619)): "KB 일반가 × LTV"로 한도를 구하고 한도 상한(캡)을 적용한 뒤 "매매가 − 한도"를 자기자금으로 보여준다. 취득비용 포함 금액은 별도 줄로 나눈다. "DSR·소득은 반영하지 않음"도 명시한다. 결과 카드는 이 순서(담보 기준 → LTV 금액 → 상한 → 예상 한도 → 자기자금)를 따르고, 계산 과정을 숨기지 않는다.
- **Zillow 저장 매물 비교** ([biggerpockets 소개글](https://www.biggerpockets.com/member-blogs/3844/27270-5-real-estate-apps-for-non-realtors)): 저장한 매물을 몇 가지 지표로 나란히 비교한다. 모바일 첫 버전에서는 표 대신 핵심 지표 3개(매매가, 예상 한도, 자기자금)를 담은 카드 목록에 정렬을 붙인다.
- **Redfin 즐겨찾기** ([redfin.com 블로그](https://redfin.com/blog/2014/05/redfin-launches-completely-redesigned-iphone-app.html)): 저장한 매물을 한 탭에서 바로 연다. 저장 목록은 화면 전환 한 번으로 닿게 한다.

## 범위

- 포함:
  - 입력: 매매가, KB시세(둘 다 만원 단위, 최대 9자리), 주택 소재지(규제지역 / 수도권 비규제 / 비수도권), 보유 상태(무주택 / 무주택·생애최초 / 1주택 처분조건부 / 1주택 미처분 추가구입, 라디오 4값)
  - 계산: 담보 기준 = min(매매가, KB시세). LTV 금액 = `Math.floor(담보 기준 × LTV% / 100)`. 예상 한도 = min(LTV 금액, 한도 상한). 필요한 자기자금 = 매매가 − 예상 한도
  - 입력 검증(필드별 오류), 금액 한글 보조 표시
  - 규제 값(LTV, 한도 상한, 기준일, 출처)을 파일 한 곳에 모은다. 화면에 기준일과 근거를 표시한다.
  - 미확인 규제 조합 처리(아래 "미확인 값 처리 규칙")
  - 매물 저장, 목록, 정렬, 불러와 수정, 삭제, 저장소 손상·접근 불가 처리
  - 모바일 사용성: 입력 중 값 유지(draft), 뒤로 가기, 목록 스크롤 복원
- 범위 밖:
  - DSR, 스트레스 DSR, 소득·기존 부채 반영
  - 서민·실수요자 우대 LTV, 2주택 이상 다주택자, 정책대출(디딤돌·보금자리론·청년미래보금자리론), 비주택(오피스텔·상가)
  - 취득세·중개보수 등 부대비용([ADR-006](../decisions/006-extra-costs.md))
  - 주소로 규제지역 자동 판정, KB시세 자동 조회
  - 기기 간 동기화, 공유 링크(딥링크)
  - 저장 형식 버전 필드와 마이그레이션([ADR-001](../decisions/001-storage.md))

## 규제 값 (2026-10-21 확인)

### 확인 경로

| ID  | 1차 출처                                                                                                                                                                                        | 게시일     | 시행일     | 이번 스펙에 쓴 내용                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | 금융위 「가계부채 관리 강화 방안」 [fsc.go.kr/no010101/84824](https://www.fsc.go.kr/no010101/84824)                                                                                             | 2025-06-27 | 2025-06-28 | 수도권·규제지역 주담대 최대 6억. 생애최초 LTV 수도권·규제 80%→70%, 지방 현행 80% 유지. 처분조건부 1주택 비규제 70%. 미처분 1주택·2주택+ 추가구입은 수도권 0%(신설), 규제지역 30%→0%, 비규제(지방) 60% |
| S2  | 금융위 「주택시장 안정화를 위한 대출수요 관리 방안」(10·15 대책) [fsc.go.kr/po010105/85432](https://fsc.go.kr/po010105/85432)                                                                   | 2025-10-15 | 2025-10-16 | 규제지역 무주택자(처분조건부 1주택자 포함) LTV 40%, 비규제 70% 유지. 수도권·규제지역 주택구입목적 주담대 한도: 시가 15억 이하 6억, 15억 초과~25억 이하 4억, 25억 초과 2억                             |
| S3  | 금융위 「10.15 대책 관련 FAQ」 Q4 [fsc.go.kr/po020201/85466](https://fsc.go.kr/po020201/85466) (보도: [korea.kr 156719450](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156719450)) | 2025-10-17 | —          | 규제지역 생애최초 LTV 70% "(좌동)" 유지. 생애최초도 최대한도 구간 동일 적용. 시가 정의는 없음                                                                                                         |
| S4  | 금융위 「규제지역 추가 지정 관련 긴급 가계부채 점검회의」 [fsc.go.kr/no010101/87222](https://www.fsc.go.kr/no010101/87222)                                                                      | 2026-06-30 | 2026-07-01 | 동탄구·기흥구·구리시 규제지역 추가, LTV 70%→40%. 생애최초·정책모기지 60~70%. 다주택자는 수도권 주택구입 시 규제지역 여부와 무관하게 LTV 0%                                                            |
| S5  | 금융위 「2026년도 가계부채 관리방안」 [fsc.go.kr/no010101/86606](https://www.fsc.go.kr/no010101/86606)                                                                                          | 2026-04-01 | —          | 은행 일반 주담대 LTV·한도 변경 없음(온투업에만 같은 한도 확대)                                                                                                                                        |
| S6  | 금융위 「2026년 9월 가계대출 동향 및 가계부채 점검회의」 [fsc.go.kr/no010101/87939](https://www.fsc.go.kr/no010101/87939)                                                                       | 2026-10-15 | —          | LTV·한도·규제지역·생애최초 신규 변경 없음(8·13 대책 후속조치는 보금자리론·전세보증만 해당)                                                                                                            |

### LTV 행렬 (구입 대상 주택 소재지 × 보유 상태)

| 소재지 \ 보유 상태 | 무주택(일반)           | 무주택·생애최초                       | 1주택 처분조건부     | 1주택 미처분(추가구입)        |
| ------------------ | ---------------------- | ------------------------------------- | -------------------- | ----------------------------- |
| 규제지역           | 40% (S2, 2025-10-16)   | 70% (S1 2025-06-28, 유지 S3·S4)       | 40% (S2, 2025-10-16) | 0% (S1 2025-06-28, 재확인 S4) |
| 수도권 비규제      | 70% (S2에서 유지 확인) | 70% (S1, 2025-06-28)                  | 70% (S1, 2025-06-28) | 0% (S1, 2025-06-28)           |
| 비수도권(비규제)   | 70% (S2에서 유지 확인) | 80% (S1 "지방 현행 유지", 2025-06-28) | 70% (S1, 2025-06-28) | 60% (S1, 2025-06-28)          |

`rate`는 위 표의 퍼센트 숫자를 그대로 쓰는 0~100 정수다([ADR-002](../decisions/002-money-unit.md)).

### 한도 상한

- 적용 지역: 규제지역, 수도권 비규제 (S1·S2의 "수도권·규제지역"). 비수도권 비규제에는 상한이 없다.
- 구간(S2, 시행 2025-10-16): 시가 15억 이하 → 6억 / 15억 초과 25억 이하 → 4억 / 25억 초과 → 2억. 생애최초에도 같은 구간을 적용한다(S3).
- 구간을 판단하는 "시가"가 무엇인지(KB시세인지 매매가인지 감정가인지)는 S2·S3 원문에 정의가 없어 **미확인**이다. KB시세라는 보도는 있지만 1차 출처가 아니다. [ADR-005](../decisions/005-cap-reference-price.md)에 따라 **구간 판단 가격 = max(매매가, KB시세)**로 보수적으로 처리하고, 어느 가격이 쓰였는지를 화면에 표시한다. 1차 출처에서 정의가 확인되면 가격 선택 함수(`selectCapReferencePrice`) 한 곳만 바꾼다.
- 구간 경계: 15억 이하는 `≤ 150000`, 15억 초과 25억 이하는 `150000 < p ≤ 250000`, 25억 초과는 `> 250000`(만원).

### 확인 강도 메모

- 규제지역 생애최초 70%: S1에 수치가 명시되어 있다. 10·15 이후 유지 여부는 S3 표의 "(좌동)"과 S4의 "60~70%" 범위로 교차 확인했다. S3 표는 웹 추출 과정에서 깨져 있었으므로 구현 전에 S3 첨부 원본(hwpx/pdf)으로 한 번 더 확인한다.
- 비수도권 생애최초 80%: S1이 "지방 현행 유지"라고 하고, 같은 문서가 현행값을 "전 지역 80%"로 적고 있다. 근거는 이것이다.
- 지시문에서 예로 든 "1주택자 규제지역 처분조건부"는 S2에 "무주택자(처분조건부 1주택자 포함)" 40%로 명시되어 있어 **확인됨**이다.
- 처분 약정 기한은 S1 본문(6개월)과 표 주석(2년)이 다르게 읽힌다. 미확인이므로 화면에 기한 수치를 쓰지 않는다.
- 현재 미확인으로 남는 것: 비수도권 규제지역(2026-10-21 기준 지정 사례가 없어 선택지로 두지 않음, 가정 A2), 한도 구간의 시가 정의(ADR-005로 보수 처리).

### 미확인 값 처리 규칙

- 데이터: 규제 파일에서 LTV 셀은 `{ rate: number | null, effectiveDate: string | null, sourceUrl: string | null, note?: string }` 형태다. `rate: null`이 "미확인"이다. `rate: 0`은 확인된 0%이며 미확인과 다르다(falsy 검사 금지). 숫자를 채울 때는 `sourceUrl`과 `effectiveDate`를 반드시 같이 적는다(무결성 테스트로 강제).
- 계산: LTV가 `null`이면 `calculateLoan`은 `status: "unconfirmed"`를 반환한다. 이때 **한도 상한(`cap`)과 담보 기준은 계산해서 돌려주고**, `ltvAmount` / `loanLimit` / `ownFunds`만 `null`이다. 0이나 비슷한 조합의 값으로 대신 채우지 않는다. 반환 타입은 판별 유니온이라 `status`를 확인하기 전에는 null 가능 필드를 쓸 수 없다.
- 화면:
  - LTV 칸에는 회색 "미확인" 배지를 단다.
  - 예상 한도와 자기자금 자리에는 "—"를 쓰고 "이 조건의 LTV는 1차 출처로 확인되지 않아 계산하지 않습니다"를 표시한다.
  - 담보 기준(min 값)과 한도 상한은 규제 미확인과 무관하게 계산되므로 그대로 보여준다.
  - 확인된 LTV 0%는 미확인과 다르다. "LTV 0% · 주택구입 목적 주담대 불가"로 숫자를 보여주고, 자기자금은 매매가 전액으로 표시한다.
  - 저장 목록에서도 미확인 매물은 "계산 불가" 배지를 달고, 자기자금순 정렬에서는 맨 뒤로 보낸다.

## 데이터 모델

백엔드가 없다. 저장 위치는 localStorage다([ADR-001](../decisions/001-storage.md)).

### 타입 계약 (`src/lib/types/`)

```ts
type Region = "regulated" | "capitalNonRegulated" | "nonCapital";
type Borrower = "noHome" | "firstHome" | "oneHomeDisposal" | "oneHomeKeep";

type LtvCell = {
  rate: number | null;
  effectiveDate: string | null;
  sourceUrl: string | null;
  note?: string;
};
type CapTier = { upTo: number | null; cap: number }; // 만원, upTo: null은 마지막 구간
type LoanCap = { regions: Region[]; tiers: CapTier[]; effectiveDate: string; sourceUrl: string };
type RegulationSource = {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  effectiveDate: string | null;
};
type Regulations = {
  baseDate: string; // YYYY-MM-DD
  ltvTable: Record<Region, Record<Borrower, LtvCell>>;
  loanCap: LoanCap;
  sources: RegulationSource[];
};

type LoanInput = { salePrice: number; kbPrice: number; region: Region; borrower: Borrower };
type PriceSource = "salePrice" | "kbPrice" | "equal";
type CapResult = {
  amount: number;
  tierIndex: number;
  tierLabel: string; // tierLabel은 표시용 문구, 테스트는 amount·tierIndex로 단언
  capReferencePrice: number;
  capReferenceSource: PriceSource;
  isBoundaryCase: boolean;
};
type LoanResultBase = {
  collateralBase: number;
  collateralSource: PriceSource;
  ltv: LtvCell;
  cap: CapResult | null;
};
type LoanResult =
  | (LoanResultBase & { status: "ok"; ltvAmount: number; loanLimit: number; ownFunds: number })
  | (LoanResultBase & { status: "unconfirmed"; ltvAmount: null; loanLimit: null; ownFunds: null });
```

`cap`은 한도 상한이 적용되지 않는 지역(비수도권)에서만 `null`이다.

### Listing (저장 매물)

입력값만 저장하고 결과는 저장하지 않는다. 화면에 띄울 때마다 현재 규제로 다시 계산한다([ADR-007](../decisions/007-store-inputs-only.md)). 정렬·카드 요약 함수는 `regulations`를 인자로 받는다.

| 필드                  | 타입       | 설명                                                                                                                                                |
| --------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                    | string     | 스토어의 `createId()`가 만든 비어 있지 않은 문자열. 기본 구현은 `crypto.getRandomValues` 16바이트 hex([ADR-010](../decisions/010-id-generation.md)) |
| name                  | string     | 매물 이름. trim 후 1~40자, 필수. 중복 허용(id로 구분)                                                                                               |
| salePrice             | number     | 매매가, 만원 단위 양의 정수, 최대 999,999,999                                                                                                       |
| kbPrice               | number     | KB시세, 만원 단위 양의 정수, 최대 999,999,999                                                                                                       |
| region                | `Region`   | 구입 대상 주택 소재지                                                                                                                               |
| borrower              | `Borrower` | 보유 상태. 생애최초는 `firstHome`                                                                                                                   |
| createdAt / updatedAt | string     | ISO 8601                                                                                                                                            |

- 저장 키: `loan-calculator/listings`(배열 JSON, 버전 필드 없음), `loan-calculator/draft`(작성 중 입력)
- **손상 판정은 전체 단위다.** 다음 중 하나라도 어긋나면 목록 전체를 `corrupt`로 본다. 항목만 골라 버리면 조용한 손실이 되기 때문이다.
  - 값이 빈 문자열이거나 JSON 파싱 실패, 배열이 아님
  - 요소의 id가 비어 있지 않은 문자열이 아님
  - name이 문자열이 아니거나 길이가 1~40자(코드포인트 기준)를 벗어남
  - salePrice / kbPrice가 1 이상 999,999,999 이하 정수가 아님
  - region / borrower가 정해진 값이 아님
  - createdAt / updatedAt이 유효한 ISO 8601 날짜 문자열이 아님
  - 키가 없는 것(`getItem`이 `null`)은 손상이 아니라 빈 목록이다.
- 손상 상태에서는 사용자가 "목록 초기화"를 직접 눌러야 지운다. 초기화 전에 손상 원문을 복사할 수 있는 버튼을 둔다. 손상 상태에서는 `reset`을 뺀 모든 쓰기를 스토어가 막는다(UI 버튼 비활성화에만 의존하지 않는다).
- 접근 불가(`getItem`/`setItem`이 throw: 시크릿 모드, 용량 초과)는 `unavailable`이다.

### Draft (작성 중 입력)

```ts
type Draft = {
  salePrice: string;
  kbPrice: string;
  region: Region;
  borrower: Borrower;
  listingId: string | null;
};
```

- 금액은 입력 중인 문자열(쉼표 제거)로 둔다. 잘못된 입력도 새로고침 후 그대로 남기기 위해서다.
- 기본값: 금액 빈 문자열, `region: "regulated"`, `borrower: "noHome"`, `listingId: null`([ADR-009](../decisions/009-borrower-ui.md)). 가장 LTV가 낮은 쪽이라 결과를 과대하게 보여줄 위험이 작다.
- 계산 화면은 **항상 draft만 본다**. 저장 매물을 열면 draft를 `{ 매물 값, listingId }`로 바꾼다([ADR-004](../decisions/004-routing-state.md)).
- `listingId`가 가리키는 매물이 목록(정상 로드 상태)에 없으면 `null`로 본다(삭제된 경우).
- 목록과 달리 draft는 손상돼도 **조용히 기본값으로 시작한다**(작성 중 임시 값이라 잃어도 괜찮다). 스키마가 맞지 않으면 전체를 기본값으로 바꾼다.
- 저장소 접근이 불가능하면 draft는 메모리로만 동작한다.

### 규제 파일

`src/lib/constants/loanRegulations.ts` 한 파일에 둔다([ADR-003](../decisions/003-directory.md)). `erasableSyntaxOnly` 설정 때문에 enum 대신 문자열 유니온을 쓴다. `as const`는 쓰지 않고 `Regulations` 타입에 `satisfies`로 맞춘다(`as const`는 `rate: null` 셀을 리터럴 타입으로 좁혀서 테스트의 미확인 fixture 주입이 타입 오류가 되기 때문이다).

- `REGULATION_BASE_DATE`: 확인일 "2026-10-21"
- `LTV_TABLE`: region × borrower → LTV 셀(12개)
- `LOAN_CAP`: 적용 지역 목록, 구간 배열 `{ upTo: number | null, cap: number }[]`(만원 단위, `upTo: null`은 마지막 구간), 출처, 시행일
- `REGULATION_SOURCES`: S1~S6 목록(제목, URL, 게시일, 시행일)
- `LOAN_REGULATIONS = { baseDate: REGULATION_BASE_DATE, ltvTable: LTV_TABLE, loanCap: LOAN_CAP, sources: REGULATION_SOURCES } satisfies Regulations` — `calculateLoan`의 기본 인자이고, 화면은 이 객체에서 기준일·출처를 읽는다.

## API 계약

HTTP API는 없다(백엔드 없음). react-query·axios는 쓰지 않는다. 저장소는 `useSyncExternalStore`로 구독한다. 대신 모듈 계약을 정한다. 1-1에서 이 시그니처를 타입 파일과 스텁으로 먼저 확정해 test 담당이 병렬로 작성할 수 있게 한다.

파일 배치(ADR-003): `src/lib/constants/{loanRegulations,paths}.ts`, `src/lib/types/`, `src/lib/utils/`(순수 함수 전부), `src/hooks/{useListings,useDraft,useHashRoute}.ts`, `src/containers/Mortgage/{Calculator,Listings}/`, 라우트별 화면 선택은 `src/AppRoutes.tsx` 한 곳(`App.tsx`는 Provider/Layout 자리). `useListings`는 도메인 훅이지만 두 container가 함께 쓰므로 `hooks/`로 승격한다. 두 container는 서로 import하지 않는다. 스토어와 규제 객체는 기본값이 실제 localStorage·`LOAN_REGULATIONS`이고, 통합 테스트에서 fixture를 끼워 넣을 수 있어야 한다(방식은 구현자 재량).

| 모듈         | 시그니처                                                                                                                                            | 입력 → 출력                                                     | 에러·규칙                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 계산         | `calculateLoan(input, regulations = LOAN_REGULATIONS): LoanResult`                                                                                  | `LoanInput` → 위 `LoanResult`                                   | 입력은 양의 정수라는 전제를 타입 주석에 적는다(검증은 화면). `ltvAmount = Math.floor(collateralBase * rate / 100)`, `loanLimit = min(ltvAmount, cap?.amount ?? ltvAmount)`, `ownFunds = salePrice - loanLimit`. 소수 `rate`와 곱하지 않는다 |
| 구간 찾기    | `findCapTier(price, tiers): { index, cap } \| null`                                                                                                 | 가격 하나 → 구간                                                | 150000→0, 150001→1, 250000→1, 250001→2. 0 이하는 `null`(범위 밖)                                                                                                                                                                            |
| 가격 선택    | `selectCapReferencePrice(salePrice, kbPrice): number`                                                                                               | → `max(매매가, KB시세)`                                         | ADR-005. 정의가 확인되면 이 함수 한 줄만 바꾼다                                                                                                                                                                                             |
| 경계 매물    | `cap.isBoundaryCase`                                                                                                                                | —                                                               | `findCapTier(salePrice).index !== findCapTier(kbPrice).index`인 구간 비교만으로 정한다. 결과 금액이 실제로 달라지는지와 무관                                                                                                                |
| 금액 파싱    | `parseAmount(raw): { kind: "empty" } \| { kind: "value", value } \| { kind: "invalid" }`                                                            | 문자열 → 숫자                                                   | 앞뒤 공백 제거, 쉼표 제거 후 `^\d+$`만 숫자. 빈 값·공백만은 `empty`                                                                                                                                                                         |
| 금액 검증    | `validateAmount(raw): { status: "empty" } \| { status: "valid", value } \| { status: "error", message }`                                            | 문자열 → 결과                                                   | 아래 "입력 검증 규칙" 표                                                                                                                                                                                                                    |
| 금액 포맷    | `formatManwon(n): string`                                                                                                                           | 0 이상 정수 → 한글 금액                                         | 아래 "formatManwon 규칙" 표                                                                                                                                                                                                                 |
| 이름 검증    | `validateListingName(raw): { ok: true, name } \| { ok: false, message }`                                                                            | 문자열 → trim한 이름                                            | trim 후 1~40자. 글자 수는 코드포인트 기준(`Array.from(name).length`). 40자 통과, 41자 오류, 공백만 오류                                                                                                                                     |
| 조건 요약    | `describeCondition(region, borrower): string`                                                                                                       | → "규제지역 · 무주택" 등                                        | 결과 카드 상단과 목록 카드가 함께 쓴다                                                                                                                                                                                                      |
| 목록 저장    | `loadListings(storage)` / `saveListings(storage, listings)`                                                                                         | `Storage` 주입                                                  | `load`: `{ ok: true, listings } \| { ok: false, reason: "corrupt", rawText } \| { ok: false, reason: "unavailable" }`. `save`: `{ ok: true } \| { ok: false, reason: "unavailable" }`                                                       |
| 목록 스토어  | `createListingStore({ storage, createId, now })`                                                                                                    | 팩토리. `createId(): string`, `now(): string`(ISO) 주입         | 아래 "스토어 규칙"                                                                                                                                                                                                                          |
| draft        | `parseDraft(raw: unknown): Draft` / `loadDraft(storage): Draft` / `saveDraft(storage, draft): { ok: true } \| { ok: false, reason: "unavailable" }` |                                                                 | 손상·키 없음·접근 불가 모두 기본 draft를 반환하고 throw하지 않는다. 쓰기 실패는 호출 쪽이 무시해도 된다                                                                                                                                     |
| draft 스토어 | `createDraftStore({ storage })`                                                                                                                     |                                                                 | `getSnapshot(): Draft`, `subscribe`, `update(patch)`, `clear()`. 메모리 상태가 원본이고 변경 때마다 `saveDraft`로 최선 기록                                                                                                                 |
| 정렬         | `sortListings(listings, sort, regulations): Listing[]`                                                                                              | `sort: "ownFunds" \| "recent"`                                  | 아래 "정렬 규칙"                                                                                                                                                                                                                            |
| 라우트       | `parseRoute(hash): Route`                                                                                                                           | 문자열 → `{ name: "calculator" } \| { name: "listings", sort }` | 아래 "라우트 규칙"                                                                                                                                                                                                                          |
| 경로         | `PATHS` (`src/lib/constants/paths.ts`)                                                                                                              |                                                                 | `calculator: "#/"`, `listings(sort?)`: 기본 정렬이면 `"#/listings"`, 최근순이면 `"#/listings?sort=recent"`                                                                                                                                  |
| 훅           | `useListings()` / `useDraft()` / `useHashRoute()`                                                                                                   |                                                                 | 스토어를 얇게 감싼다. 상태 로직은 훅 밖(React 없는 모듈)에 둔다                                                                                                                                                                             |

### 입력 검증 규칙 (`validateAmount`)

| 입력                                                  | 결과                        | 메시지                                               |
| ----------------------------------------------------- | --------------------------- | ---------------------------------------------------- |
| `""`, 공백만                                          | `empty`                     | 오류 아님. 결과 카드가 빈 상태 문구를 보여준다       |
| `"125000"`                                            | `valid` 125000              | —                                                    |
| `"125,000"`(붙여넣기 포함)                            | 쉼표 제거 후 `valid` 125000 | —                                                    |
| `"0012"`                                              | `valid` 12                  | —                                                    |
| `"0"`, `"000"`                                        | `error`                     | "0보다 큰 금액을 입력하세요"                         |
| `"-5"`, `"12a"`, `"1 000"`                            | `error`                     | "숫자만 입력하세요"                                  |
| `"12.5"`                                              | `error`                     | "정수(만원 단위)로 입력하세요"                       |
| 앞의 0을 뗀 자릿수가 10자리 이상(값 999,999,999 초과) | `error`                     | "최대 9자리(999,999,999만원)까지 입력할 수 있습니다" |
| `"999999999"`                                         | `valid`                     | —                                                    |

오류는 입력 중이 아니라 blur 시점에 해당 필드 바로 아래에 표시한다. 한글 보조 표시는 입력 즉시 갱신한다. 유효하지 않은 금액이 하나라도 있으면 결과 카드는 빈 상태가 되고 저장 버튼은 비활성이다.

### formatManwon 규칙

`억 = floor(n / 10000)`, `만 = n % 10000`. 각 숫자는 천 단위 쉼표를 쓴다.

| n               | 출력                 |
| --------------- | -------------------- |
| 0               | "0만원"              |
| 1               | "1만원"              |
| 9999            | "9,999만원"          |
| 10000           | "1억원"              |
| 10001           | "1억 1만원"          |
| 100000          | "10억원"             |
| 125000          | "12억 5,000만원"     |
| 999999999(최대) | "99,999억 9,999만원" |

### 스토어 규칙 (`createListingStore`)

- 스토어는 React 없이 동작하고, 훅은 `useSyncExternalStore`로 감싼다.
- 스냅샷 타입: `{ status: "ok", listings } | { status: "corrupt", rawText } | { status: "unavailable" }`.
- `getSnapshot()`은 `storage.getItem` 원문 문자열이 직전과 같으면 **같은 참조**를 반환한다(원문 기준 캐시). 다르면 다시 파싱한다.
- `add` / `update` / `remove` / `reset`은 성공 시 구독자에게 통지한다. 다른 탭 반영을 위해 훅이 `window`의 `storage` 이벤트(키가 `loan-calculator/listings`일 때)로 같은 통지를 호출한다.
- `add(input)`: `createId()`, `now()`로 id와 `createdAt = updatedAt`을 채워 저장하고 `{ ok: true, listing }`을 반환한다.
- `update(id, input)`: `id`와 `createdAt`을 유지하고 `updatedAt`만 `now()`로 갱신한다. 목록에서의 배열 위치는 유지한다. 없는 id면 저장하지 않고 `{ ok: false, reason: "notFound" }`를 반환한다.
- `remove(id)`: 없는 id면 `{ ok: false, reason: "notFound" }`, 저장하지 않는다.
- `reset()`: 손상 원문을 지우고(`removeItem`) 빈 목록 `ok` 상태로 만든다. 접근 불가면 `{ ok: false, reason: "unavailable" }`.
- 쓰기 결과: `{ ok: true } | { ok: false, reason: "corrupt" | "unavailable" | "notFound" }`. 스냅샷이 `corrupt`/`unavailable`이면 `reset`을 뺀 쓰기는 `saveListings`/`setItem`을 **호출하지 않고** 즉시 실패한다.
- `setItem`이 throw(`unavailable`)하면 메모리 상태도 바꾸지 않는다(저장되지 않은 항목을 목록에 보여주지 않는다). UI는 저장 시트 안에 "저장하지 못했습니다. 이 브라우저에서 저장소를 사용할 수 없습니다"를 표시한다.

### 정렬 규칙 (`sortListings`)

- `"ownFunds"`(기본): `calculateLoan(listing, regulations).ownFunds` 오름차순. 동률이면 `createdAt` 내림차순, 그래도 같으면 입력 순서(안정 정렬). `status: "unconfirmed"`(자기자금 `null`)는 맨 뒤에 두고, 미확인끼리는 `createdAt` 내림차순. 확인된 LTV 0% 매물은 자기자금이 매매가 전액이라 그 값 위치에 정상 정렬된다.
- `"recent"`: `updatedAt` 내림차순. 미확인 여부는 순서에 영향을 주지 않는다(자기자금을 쓰지 않기 때문).
- 삭제 후에도 같은 규칙으로 다시 정렬된다.

### 라우트 규칙 (`parseRoute`)

| 해시                                          | 결과                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `""`, `"#"`, `"#/"`                           | `{ name: "calculator" }`                                                   |
| `"#/listings"`                                | `{ name: "listings", sort: "ownFunds" }`                                   |
| `"#/listings?sort=recent"`                    | `{ name: "listings", sort: "recent" }`                                     |
| `"#/listings?sort=foo"`                       | `{ name: "listings", sort: "ownFunds" }` (잘못된 값은 기본값)              |
| `"#/listing/abc"`, `"#/x"` 등 알 수 없는 해시 | `{ name: "calculator" }` — `useHashRoute`가 정규 경로 `#/`로 `replace`한다 |

라우트는 `#/`와 `#/listings` 두 개뿐이다([ADR-004](../decisions/004-routing-state.md)). `#/listing/{id}`는 없다.

## 화면

모바일 360px 너비를 기준으로 한 컬럼 레이아웃이다. 화면은 2개이고 해시로 전환한다(ADR-004). 상단 탭 "계산 | 저장 목록"으로 오간다.

1. **계산 화면**(`#/`)
   - 입력: 매매가, KB시세(`AmountInput`: 숫자 키패드 `inputMode="numeric"`, 천 단위 쉼표 표시, 아래에 한글 금액 "12억 5,000만원"을 `aria-describedby`로 연결), 소재지 세그먼트 3개, 보유 상태 라디오 그룹 4개(무주택 / 무주택·생애최초 / 1주택 처분조건부 / 1주택 미처분(추가구입); 360px에서는 세로 목록 또는 2×2 칩, 선택 상태가 보이게). 라디오 값이 `borrower`와 1:1이라 토글·모순 상태가 없다. 처음 열면 규제지역·무주택이 선택돼 있고, 이후 마지막 선택은 draft가 기억한다.
   - 결과 카드: 상단에 **조건 요약**(예: "규제지역 · 무주택·생애최초") → 담보 기준(매매가가 낮은지, KB시세가 낮은지, 같은지 `collateralSource`로 표시) → 적용 LTV → LTV 금액 → 한도 상한(구간 표시와 "구간 기준 가격: 15억 2,000만원(매매가)"처럼 쓰인 가격 표시, `isBoundaryCase`면 "구간 경계 매물: 은행 확인 필요") → **예상 한도** → **필요한 자기자금(부대비용 제외)**. 그 아래에 "DSR·소득 심사 미반영, 취득세 등 부대비용 제외"를 한 줄로 쓴다. 결과 카드는 `regulations`를 prop으로 받는다(ADR-008).
   - 기준일: 결과 카드 하단에 "규제 기준일 {REGULATION_BASE_DATE} · 근거 보기"를 둔다. 펼치면 적용된 LTV 셀과 상한의 출처 링크·시행일이 나온다. 링크는 `target="_blank"`, `rel="noopener noreferrer"`.
   - 하단 고정 바: 예상 한도와 자기자금 요약, 저장 버튼. 키보드가 올라와도 입력 바로 아래의 결과 카드에서 값을 볼 수 있으므로 바는 그대로 두고 키보드가 덮는 것을 허용한다(`visualViewport` 대응은 하지 않는다).
     - 저장 버튼 상태: 두 금액이 유효하고 저장소 정상 → "저장". `draft.listingId`가 있고 입력값(금액 2개, 소재지, 보유 상태)이 그 저장본과 같으면 비활성 "저장됨". 목록이 `corrupt`이면 비활성 + "저장된 목록이 손상되어 저장할 수 없습니다(목록 화면에서 초기화)", `unavailable`이면 비활성 + "이 브라우저에서는 저장할 수 없습니다".
   - 상태: 빈 상태(입력 전 또는 금액 오류)는 결과 카드 자리에 "매매가와 KB시세를 입력하세요". 필드 오류는 해당 필드 바로 아래에 붙인다. 미확인 상태는 위 규칙대로 표시한다. 계산이 동기라 로딩 상태는 없다.
   - "새 계산" 버튼: 금액 2칸을 비우고 `listingId`를 `null`로 만든다. 소재지·보유 상태는 유지한다.
   - 저장 시트: 이름 입력(현재 글자 수 "n/40" 표시, blur 시 오류, 이름 규칙은 `validateListingName`). `listingId`가 없으면 "저장" 한 버튼, 있으면(불러온 매물 수정 중) "덮어쓰기"와 "새로 저장" 두 버튼. 시트는 히스토리에 넣지 않고 닫기/취소 버튼으로만 닫는다(모바일 뒤로 가기는 이전 화면 이동이다). 저장에 성공하면 시트가 닫히고 **계산 화면에 그대로 머문다**. `add`/"새로 저장" 성공 시 `draft.listingId`를 새 id로, "덮어쓰기"는 유지한다. 그래서 저장 직후 버튼은 "저장됨"이 된다. 쓰기 실패는 시트 안 오류 문구로 보인다.
2. **저장 목록 화면**(`#/listings`, 상단 탭으로 진입)
   - 상단에 규제 기준일을 표시한다. 결과는 현재 규제로 다시 계산한 값이다.
   - 정렬 토글: 자기자금순(기본) / 최근 저장순. 선택은 `#/listings?sort=recent`에 두어 새로고침해도 남고, 정렬 변경은 `replace`로 한다.
   - 카드: 이름, 매매가, 예상 한도, 필요한 자기자금, 조건 요약(예: "규제 · 무주택·생애최초"). 미확인 매물은 "계산 불가" 배지.
   - 카드를 누르면 `draft`를 `{ 매물 값, listingId }`로 바꾸고 `#/`로 push한다. 계산 화면에서 뒤로 가기를 누르면 목록으로 돌아온다. 편집 중에 목록으로 이동하는 것은 draft에 값이 남기 때문에 이탈 확인(`confirm`)을 두지 않는다.
   - 삭제는 카드의 삭제 버튼을 누른 뒤 확인 한 번을 거친다. 삭제된 매물을 가리키던 `draft.listingId`는 `null`로 취급된다.
   - 빈 상태: "저장한 매물이 없습니다" 문구와 계산 화면으로 가는 버튼
   - 오류 상태: `corrupt`면 손상 안내 문구, "원문 복사" 버튼, "목록 초기화" 버튼(확인 문구: "손상된 저장 데이터를 삭제하고 빈 목록으로 시작합니다. 되돌릴 수 없으니 원문을 먼저 복사하세요"). `unavailable`이면 "이 브라우저에서는 저장소를 사용할 수 없어 저장 목록을 쓸 수 없습니다"만 보이고 초기화 버튼은 없다. 어느 경우든 계산은 동작한다.
   - 목록 스크롤: 언마운트 때 `scrollY`를 모듈 변수에 저장하고 마운트 때 복원한다. 상단 탭을 눌러 들어올 때는 0으로 시작한다. 새로고침하면 사라진다.

- 매일 쓰는 사람이 반복해서 겪을 불편:
  - 작성 중이던 입력값이 새로고침이나 앱 재진입 후에도 남아야 한다(draft 저장).
  - 목록에서 매물을 열었다가 뒤로 가기를 누르면 목록으로, 같은 스크롤 위치로 돌아와야 한다. 탭 전환은 `replace`라 탭을 오가도 뒤로 가기 이력이 쌓이지 않는다.
  - 0을 여러 개 치다 보면 자릿수를 틀리기 쉽다. 한글 금액 표시로 바로 확인하게 한다.
  - 오류 메시지는 화면 상단이 아니라 해당 필드 옆에 둔다.
  - 조건(소재지·보유 상태)은 마지막 선택을 기억한다(draft에 포함).
  - 저장하면 입력이 지워지지 않고 계산 화면에 남는다. 새 매물은 "새 계산"으로 시작한다.

## 수용 기준

- [ ] AC-1: `calculateLoan`이 `collateralBase = min(매매가, KB시세)`, `collateralSource`(`salePrice`/`kbPrice`/`equal`), `ltvAmount = Math.floor(collateralBase × rate / 100)`, 예상 한도 = min(ltvAmount, 상한), 자기자금 = 매매가 − 예상 한도를 반환한다. 단위 테스트 예시(매매가/KB시세, 단위 만원):
  - (규제·무주택, 120000/115000) → 담보 115000(`kbPrice`), ltvAmount 46000, 한도 46000, 자기자금 74000
  - (규제·생애최초, 100000/100000) → 담보 100000(`equal`), ltvAmount 70000, 상한 60000, 한도 60000, 자기자금 40000
  - (규제·무주택, 200000/200000) → ltvAmount 80000, 상한 40000, 한도 40000, 자기자금 160000
  - (비수도권·생애최초, 50000/48000) → 담보 48000, ltvAmount 38400, `cap`은 `null`, 한도 38400, 자기자금 11600
  - (수도권 비규제·1주택 미처분, 80000/80000) → LTV 0%는 미확인이 아니므로 `status: "ok"`, 한도 0, 자기자금 80000
  - 내림: (비수도권·무주택 70%, 99999/99999) → ltvAmount 69999(69999.3 내림), 한도 69999, 자기자금 30000
  - 정수 연산: (비수도권·무주택 70%) 90→63, 170→119, 180→126 (소수 곱셈의 부동소수점 오차 방지)
  - 매매가 < KB시세: (규제·무주택, 100000/120000) → 담보 100000(`salePrice`), ltvAmount 40000, 한도 40000, 자기자금 60000
  - 매매가 > KB시세: (규제·무주택, 120000/100000) → 담보 100000(`kbPrice`), 한도 40000, 자기자금 80000
  - 같은 값: (규제·무주택, 100000/100000) → `collateralSource: "equal"`, 한도 40000, 자기자금 60000
- [ ] AC-2: 소재지 3개 × 보유 상태 4개 전체 조합을 순회하는 테스트가, 테스트 파일 안에 **직접 적은** 기대 LTV 12개와 규제 파일 셀의 `rate`를 비교한다. 기대값은 규제지역 40/70/40/0, 수도권 비규제 70/70/70/0, 비수도권 70/80/70/60(무주택·생애최초·처분조건부·미처분 순)이다. 이 테스트는 스펙 표와 파일의 일치만 지킨다. 표 자체가 금융위 원문과 맞는지는 태스크 1-2의 사람 대조(A8)로만 확인한다. 화면(통합 테스트 #3): 처음 열면 규제지역·무주택이 선택돼 있고, 보유 상태 라디오 4개를 고르면 각각 대응하는 `borrower`로 계산된다.
- [ ] AC-3: 한도 상한 경계값. (생애최초 70% 행을 쓴다. 40% 행은 150000에서 LTV 금액과 상한이 같아 구분이 안 된다.) `cap.amount`와 `isBoundaryCase`로 단언한다.

  모든 행은 규제지역·생애최초(70%)다.

  | 매매가 | KB시세 | 구간 판단 가격 | cap.amount | 한도  | isBoundaryCase |
  | ------ | ------ | -------------- | ---------- | ----- | -------------- |
  | 150000 | 150000 | 150000         | 60000      | 60000 | false          |
  | 150001 | 150001 | 150001         | 40000      | 40000 | false          |
  | 250000 | 250000 | 250000         | 40000      | 40000 | false          |
  | 250001 | 250001 | 250001         | 20000      | 20000 | false          |
  | 150000 | 150001 | 150001         | 40000      | 40000 | true           |
  | 150001 | 150000 | 150001         | 40000      | 40000 | true           |
  | 140000 | 160000 | 160000         | 40000      | 40000 | true           |
  | 160000 | 140000 | 160000         | 40000      | 40000 | true           |
  | 250000 | 250001 | 250001         | 20000      | 20000 | true           |

  비수도권(생애최초 80%) 300000/300000은 `cap`이 `null`, 한도 240000, `isBoundaryCase` 없음. `findCapTier(150000/150001/250000/250001)`는 직접 테스트하고(구간 0/1/1/2), 0 이하는 `null`이다. `selectCapReferencePrice`는 `max`이며 별도 테스트라서 ADR-005가 바뀌면 이 테스트만 바뀐다.

- [ ] AC-4: LTV가 `null`인 조합(테스트용 규제 fixture 주입)에서 `status: "unconfirmed"`이고, `ltvAmount`·`loanLimit`·`ownFunds`는 `toBeNull()`이며 `collateralBase`와 `cap`(규제·적용 지역이면 `cap.amount`)은 계산돼 있다. `rate: 0` fixture는 미확인이 아니라 `status: "ok"`다. 화면(통합 테스트 #2, fixture를 주입한 결과 카드): "미확인" 배지와 "—"가 보이고 한도·자기자금 숫자가 없다. 확인된 0%는 "LTV 0%"로 구분해 표시한다.
- [ ] AC-5: 규제 파일 무결성 테스트. (a) region × borrower 12개 셀이 모두 존재한다. (b) `rate`가 숫자인 셀은 0~100 정수이고, `sourceUrl`은 `new URL()`로 파싱되는 https 주소이며 `REGULATION_SOURCES`의 URL 중 하나이고, `effectiveDate`는 실존하는 `YYYY-MM-DD`이며 `REGULATION_BASE_DATE` 이하다. (c) 상한 구간은 `upTo`가 오름차순이고 마지막만 `null`이며 `cap`은 내림차순이다. `LOAN_CAP`의 출처·시행일과 `REGULATION_SOURCES`의 URL·게시일에도 (b)의 형식 검사를 적용한다. (d) 화면: 계산 화면(결과 카드)과 목록 화면에 규제 기준일이 보이고(테스트는 `"2026-10-21"` 리터럴이 아니라 `REGULATION_BASE_DATE` 상수와 비교), "근거 보기" 링크가 `target="_blank"`와 `rel="noopener noreferrer"`를 가진다. "수치가 규제 파일 한 곳에만 있다"는 자동 판정이 불가능하므로 코드 리뷰 체크 항목으로 둔다.
- [ ] AC-6: 매물 저장소. (a) 이름을 붙여 저장한 매물이 새로고침 후(같은 `Storage`로 만든 새 스토어)에도 남고, 삭제하면 사라져 다시 로드해도 돌아오지 않는다. (b) 이름은 trim 후 1~40자(40자 통과, 41자 오류, 공백만 오류). (c) 손상 케이스: 빈 문자열, 잘못된 JSON, 배열이 아닌 값, 요소의 필드 누락·타입 오류·enum 오류·0/음수/소수 가격·name 41자·빈 id는 전부 `corrupt`(전체 단위)이고 키 없음은 빈 목록 `ok`다. (d) `corrupt` 상태에서 `add`/`update`/`remove`는 `setItem`을 호출하지 않고 실패하며, `reset` 후에만 빈 목록으로 돌아온다. 화면(통합 테스트 #4): 손상된 Storage를 주입하면 저장 버튼이 `disabled`이고 `setItem`이 호출되지 않으며 목록 화면에 손상 문구와 "목록 초기화"가 보인다. (e) `getItem`/`setItem`이 throw하면 `unavailable`이고, 쓰기 실패 시 메모리 목록은 바뀌지 않는다. (f) 변경이 없을 때 `getSnapshot()`은 같은 참조를 반환하고, 쓰기·`storage` 이벤트 통지 후에는 새 상태를 반환한다.
- [ ] AC-7: 목록은 기본으로 자기자금 오름차순으로 정렬되고, 동률은 `createdAt` 내림차순, 미확인 매물(fixture)은 맨 뒤이며 미확인끼리는 `createdAt` 내림차순이다. "최근 저장순"은 `updatedAt` 내림차순이다. 삭제 후에도 같은 규칙이 유지된다. 카드를 누르면 계산 화면에 입력값이 채워지고 `draft.listingId`가 그 매물이 된다. `update`(덮어쓰기)는 같은 id의 매물을 갱신하고 `createdAt`을 유지하며 `updatedAt`을 갱신하고 목록 수는 그대로다. 없는 id의 `update`/`remove`는 `notFound`이고 저장하지 않는다(통합 테스트 #5: 덮어쓰기 후 목록 개수가 그대로이고 목록 화면에 규제 기준일이 보인다). 값이 저장본과 같으면 "저장됨"으로 비활성이고, 저장 후에도 계산 화면에 머물며, "새 계산"은 금액과 `listingId`를 비운다. `listingId`가 목록에 없으면 `null`로 취급한다.
- [ ] AC-8: 모바일 사용성. (a) `validateAmount`가 위 규칙표를 따르고(빈 값·공백·0·음수·소수·쉼표·앞자리 0·문자·최대 9자리), `formatManwon`이 위 경계표를 따른다(0, 1, 9999→"9,999만원", 10000→"1억원", 10001, 최대값). (b) 통합 테스트 #1: 매매가에 0을 입력하고 blur하면 해당 필드 아래에 "0보다 큰 금액을 입력하세요"가 뜨고 저장 시트가 열리지 않는다. 금액 입력은 `inputMode="numeric"`이고 한글 금액이 `aria-describedby`로 연결된다. (c) `parseRoute`가 라우트 규칙표를 따르고, 알 수 없는 해시는 `#/`로 replace된다. (d) `parseDraft`는 손상된 값(JSON 아님, 필드 누락, enum 오류, 잘못된 `listingId` 타입)을 조용히 기본 draft로 바꾼다. 입력 도중 새로고침해도 값과 조건(소재지·보유 상태)이 남는다. (e) 수동 체크리스트의 M1~M5(360px 가로 스크롤 없음, 실기기 키패드, 키보드·고정 바, 목록 스크롤 복원, 링크 열림)를 통과한다. 목록 → 매물 열기 → 뒤로 가기를 하면 목록으로 같은 스크롤 위치에 돌아온다.

### 통합 테스트 매핑 (ADR-008)

`@testing-library/react` + `jsdom`, 파일 단위 `// @vitest-environment jsdom`, 5개 이내.

| #   | 내용                                                                                                                                          | AC         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | 매매가에 0 입력 → 해당 필드 아래 오류, 저장 시트가 열리지 않음                                                                                | AC-8       |
| 2   | 미확인 fixture를 주입한 결과 카드에 "미확인"과 "—"가 보이고 숫자가 없음. 같은 렌더에서 기준일(`REGULATION_BASE_DATE`)과 근거 링크 속성도 단언 | AC-4, AC-5 |
| 3   | 처음 열면 규제지역·무주택 선택. 보유 상태 라디오 4개 선택이 `borrower`로 계산됨                                                               | AC-2       |
| 4   | 손상된 Storage 주입 → 저장 버튼 `disabled`, `setItem` 미호출                                                                                  | AC-6       |
| 5   | 불러온 매물을 덮어쓰기 후 목록 개수 그대로. 목록 화면에 기준일 표시                                                                           | AC-7, AC-5 |

(원래 3번이던 "생애최초 토글 disabled"는 ADR-009의 4값 라디오로 토글이 사라져 위 3번으로 바꿨다.)

### 수동 체크리스트 (jsdom이 못 보는 항목)

실기기 또는 DevTools 모바일 에뮬레이션(360px)에서 해당 태스크 끝에 확인한다.

| ID  | 항목                   | 방법                                                                                                                                                                                                     | 태스크 |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| M1  | 360px 가로 스크롤 없음 | `document.documentElement.scrollWidth <= clientWidth`를 최악 입력에서 확인: 금액 9자리 두 칸과 한글 표시("99,999억 9,999만원"), 공백 없는 40자 이름, 필드 오류 메시지 동시 표시, 하단 고정 바, 목록 카드 | 1, 3   |
| M2  | 실기기 숫자 키패드     | iOS·Android에서 금액 칸을 눌러 숫자 키패드가 뜨는지                                                                                                                                                      | 1      |
| M3  | 키보드와 하단 고정 바  | 키보드가 올라온 상태에서 입력 아래 결과 카드와 바 동작이 읽을 만한지(iOS Safari)                                                                                                                         | 1, 3   |
| M4  | 목록 스크롤 복원       | 카드 10개 이상 → 아래로 스크롤 → 카드 열기 → 뒤로 가기 → 같은 위치                                                                                                                                       | 3      |
| M5  | 근거 링크 열림         | 결과 카드의 "근거 보기" 링크가 새 탭에서 실제 출처로 열리는지                                                                                                                                            | 1      |
| M6  | 휴대폰 개발 서버 저장  | `http://192.168.x.x` 주소에서 저장이 실패하지 않는지(ADR-010)                                                                                                                                            | 2      |
| M7  | 저장소 상태 재현       | DevTools로 `loan-calculator/listings`에 `{`를 직접 써서 손상 UI 확인, 시크릿 모드에서 `unavailable` UI 확인, 새로고침 후 유지(시나리오 6 대체)                                                           | 2      |

## 태스크

- [x] 1. 계산 엔드투엔드 최소 버전(타입·시그니처 + 규제 파일 + 계산 + 입력 검증·금액 입력 + 계산 화면 + 기준일 + 미확인 처리) — AC-1~5, AC-8(a)(b), 수동 M1·M2·M3·M5
  - [ ] 1-1. 골격과 계약 선행 (담당: client)
    - ADR-003 디렉토리 골격. `@/` alias는 `tsconfig.app.json`의 `paths`(TS 6에서 `baseUrl` 없는 형태 우선)와 `vite.config.ts`의 alias 양쪽에 넣고, `pnpm build`와 vitest에서 모두 동작하는지 확인한다
    - 템플릿 정리: `App.css`와 `index.css`의 템플릿 스타일 제거(전역 CSS는 리셋과 변수만, 스타일은 CSS Modules), `assets/*` 제거, `index.html`의 `lang="ko"`·`title`, 존재하지 않는 `/favicon.svg` 링크 정리, 모바일 viewport meta 확인
    - ADR-008 테스트 도구: `@testing-library/react`, `jsdom`(필요하면 user-event, jest-dom)을 devDependencies로 추가하고 React 19·vitest 5 호환을 확인한다. 풀리지 않으면 ADR-008 재검토
    - `src/lib/types/`에 위 타입 계약, `src/lib/constants/paths.ts`, 그리고 API 계약의 모든 함수 시그니처를 구현 없는 스텁으로 먼저 커밋한다
  - [ ] 1-2. 규제 파일 작성: 위 LTV 행렬(정수 퍼센트), 한도 상한 구간, `REGULATION_BASE_DATE`, 출처 S1~S6, `LOAN_REGULATIONS`(`satisfies Regulations`, `as const` 금지). 커밋 전에 S1·S3 원문 첨부로 셀 값을 사람이 대조한다(A8) (담당: client)
  - [ ] 1-3. `calculateLoan`(판별 유니온 반환, 미확인에서도 `cap` 계산), `findCapTier`, `selectCapReferencePrice`, `isBoundaryCase`(구간 비교), `collateralSource` (담당: client)
  - [ ] 1-4a. 입력부: `parseAmount`/`validateAmount`/`formatManwon`, `AmountInput`(쉼표 표시, 한글 보조 표시, `aria-describedby`, blur 오류), 소재지 세그먼트, 보유 상태 라디오 4값, 초기값 규제지역·무주택. 이 시점의 입력 상태는 `Draft`와 같은 모양의 컴포넌트 상태다 (담당: client)
  - [ ] 1-4b. 결과 카드(조건 요약, 담보 기준 출처, 구간 기준 가격 표시, 경계 문구, 라벨 "필요한 자기자금(부대비용 제외)"), 기준일·근거 보기(`rel="noopener noreferrer"`), 미확인/0% 표시, 빈 상태, 하단 고정 요약 바(저장 버튼은 비활성 자리만). 결과 카드는 `regulations`를 prop으로 받는다 (담당: client)
  - [ ] 1-5. 순수 함수 단위 테스트: AC-1 예시, AC-3 표와 `findCapTier`·`selectCapReferencePrice`, AC-4(미확인·`rate: 0` fixture), AC-2 하드코딩 12개, AC-5 무결성, `validateAmount` 규칙표, `formatManwon` 경계표 (담당: test)
  - [ ] 1-6. 통합 테스트 #1(필드 오류), #2(미확인 카드 + 기준일·링크), #3(라디오·기본값), 수동 체크리스트 M1·M2·M3·M5 실행 (담당: test)
- [ ] 2. 매물 저장과 비교 — AC-6, AC-7, 수동 M6·M7
  - [ ] 2-1. React 밖의 모듈: `loadListings`/`saveListings`, `createListingStore`(원문 기준 스냅샷 캐시, 통지, 손상 시 쓰기 차단, `reset`, `update` 규칙), `validateListingName`, `parseDraft`/`loadDraft`/`saveDraft`/`createDraftStore`, `sortListings`, `describeCondition`, 기본 id 생성기(`crypto.getRandomValues` 16바이트 hex) (담당: client)
  - [ ] 2-2. 훅과 라우팅: `useListings`/`useDraft`(`useSyncExternalStore`, `storage` 이벤트 통지), `parseRoute`·`useHashRoute`(알 수 없는 해시 `replace`), `src/AppRoutes.tsx`, 계산 화면 입력 상태를 draft로 교체(새로고침 후 유지), `listingId`가 목록에 없으면 `null` (담당: client)
  - [ ] 2-3a. 저장 시트와 계산 화면 연결: 이름 입력(글자 수, blur 오류), 저장/덮어쓰기/새로 저장, 저장 후 계산 화면 유지, "저장됨" 비활성, "새 계산", 쓰기 실패·손상·접근 불가 문구 (담당: client)
  - [ ] 2-3b. 목록 화면: 카드(조건 요약, 계산 불가 배지), 정렬 토글, 카드 → draft 교체 + `#/` push, 삭제 확인, 빈 상태, 손상 상태(원문 복사, 확인 후 초기화), 접근 불가 상태, 기준일 표시 (담당: client)
  - [ ] 2-4. 순수 함수 테스트: 저장소(왕복, 키 없음, 손상 케이스 전부, `getItem`/`setItem` throw), 스토어(손상 시 `setItem` 미호출, 스냅샷 참조 안정, `update`의 `createdAt` 유지·`updatedAt` 갱신·없는 id, `remove`, `reset`, 쓰기 실패 시 메모리 불변), `sortListings`(동률, 미확인 맨 뒤·미확인끼리, 0% 매물, 최근순), `validateListingName`(40/41자, 공백만, 이모지), `parseDraft`, `parseRoute` (담당: test)
  - [ ] 2-5. 통합 테스트 #4(손상 Storage), #5(덮어쓰기 후 개수), 수동 M6·M7 실행 (담당: test)
- [ ] 3. 매일 쓰는 사용성 마감 — AC-8(c)(d)(e), 수동 M1·M3·M4
  - [ ] 3-1. 목록 스크롤 복원(언마운트 때 모듈 변수에 저장, 탭 진입은 0부터), 상단 탭 `replace` 이동, `#/listings?sort=` 쿼리와 정렬 변경 `replace` (담당: client)
  - [ ] 3-2. 모바일 마감: 최악 입력(9자리 금액, 40자 이름, 오류 동시 표시)에서 360px 레이아웃 점검, 하단 고정 바와 키보드 동작, 저장 시트 첫 오류 필드 포커스, 접근성 속성 점검 (담당: client)
  - [ ] 3-3. 수동 체크리스트 M1·M3·M4 실행, AC-8 자동 항목 최종 점검, 변이 확인(`rate` falsy 검사, floor→round, 구간 `<=`→`<`, min→max, 손상 시 빈 목록으로 시작하도록 일부러 고쳐서 해당 테스트가 실패하는지) (담당: test)

의존 관계: 1-1(타입·시그니처 스텁)이 끝나면 1-2, 1-3, 1-4a는 병렬 가능하고, test의 1-5는 스텁 시그니처만으로 작성을 시작할 수 있다. 1-4b는 1-3 뒤, 1-6은 1-4b 뒤다. 2는 1이 끝나야 시작한다(계산 화면 골격이 필요하다). 2-1 → 2-2 → 2-3a와 2-3b는 병렬 가능하다. 2-4는 2-1 시그니처 확정 후 병렬로 쓸 수 있다. 3은 2-3b 뒤에 한다(스크롤 복원은 2-3b와 같은 사람이 이어서 하면 효율적이다). 2와 3은 둘 다 계산 화면을 건드리므로 병렬로 하려면 충돌을 조율한다.

요구사항 → 태스크 매핑:

- 매매가·KB시세 입력과 담보 기준 min → 1
- 입력 검증, 금액 한글 표시, 금액 입력 컴포넌트 → 1
- 조건별 LTV(규제지역·생애최초·무주택/1주택) → 1 (보유 상태 라디오 4값, 초기값)
- 한도 상한(구간 판단 가격 max, 경계 알림) → 1
- 필요한 자기자금(라벨에 부대비용 제외) → 1
- 규제 값 한 파일·기준일 표시·미확인 수치 금지(CLAUDE.md) → 1
- 매물 여러 개 저장(저장소, 손상·접근 불가 처리) → 2
- 매물 비교(정렬), 불러와 수정·덮어쓰기, 삭제 → 2
- 입력 중 값 유지(draft) → 2
- 뒤로 가기, 목록 스크롤 복원, 탭·정렬 쿼리 → 3 (라우트 자체는 2)
- 모바일 우선 → 1(레이아웃·입력), 3(마감)
- DSR → 범위 밖, 다음 단계 후보

## 다음 단계 후보

- 저장 목록 내보내기/불러오기(JSON 복사): iOS Safari가 오래 방문하지 않은 사이트의 저장소를 비울 수 있어 우선순위가 높다(ADR-001 뒤집을 조건)
- DSR(스트레스 DSR 포함): 소득·기존 부채·금리·만기 입력, 한도 = min(LTV 한도, 상한, DSR 한도)
- 서민·실수요자 우대 LTV(S3: 규제지역 60%, 요건은 부부합산 소득 9천만 이하·주택가 8억 이하·무주택세대주이며 1차 출처 원문 확인 필요). 보유 상태 라디오에 선택지를 추가하는 방식으로 대응한다
- 2주택 이상 다주택자 조건(S4: 수도권 LTV 0%, 비수도권은 원문 확인 필요)
- 부대비용 포함 자기자금: 사용자가 직접 입력하는 칸부터, 이후 취득세율 규제 파일(출처 확인 필요)
- 매물 2~3개를 골라 표로 나란히 비교
- 주소·시군구 선택으로 규제지역 자동 판정(서울 25개구, 경기 12곳 + 2026-07-01 동탄구·기흥구·구리시. 명단은 국토부 원문 확인 필요)
- KB시세가 없는 매물(신축·빌라)에 감정가 입력 허용
- 전입 의무(수도권·규제지역 6개월) 등 대출 조건 안내
- 정책대출(디딤돌, 보금자리론, 2027-01 출시 목표인 청년미래보금자리론)
- 매물 공유 링크(딥링크 라우트 `#/listing/{id}`), 기기 간 동기화(ADR-004·001 뒤집을 조건)
- 저장 형식 버전 필드와 마이그레이션(`region`/`borrower` 값을 바꾸거나 지울 때 필요)
- 규제 개정 시 "규제가 바뀌어 결과가 달라졌습니다" 알림(이전 기준일 대비)

## 가정

- A1: 사용자가 말한 "규제지역" 조건만으로는 규정을 맞게 적용할 수 없다. 6억 상한·생애최초 70%·1주택 미처분 0%는 "수도권" 여부에 따라 달라진다(S1). 그래서 소재지를 규제지역 / 수도권 비규제 / 비수도권 3개로 받는다.
- A2: 2026-10-21 기준 규제지역은 모두 수도권(서울 전역, 경기 일부)에 있다고 본다(S2, S4). 그래서 "비수도권 규제지역" 선택지는 두지 않는다. 비수도권이 지정되면 행을 추가하고 값이 확인될 때까지 `null`로 둔다.
- A3: 사용자가 말한 "1주택"은 규정상 처분조건부와 미처분(추가구입) 두 경우로 나뉜다(S1, S2). 둘 다 선택지로 둔다. 생애최초는 무주택에만 해당하므로 `borrower`의 한 값(`firstHome`)으로 다룬다.
- A4: 금액은 만원 단위 정수, LTV는 0~100 정수 퍼센트이며 `Math.floor(base * rate / 100)`로 내림한다(ADR-002). 은행별 절사 단위는 반영하지 않는다.
- A5: KB시세는 사용자가 KB부동산 등에서 보고 직접 입력한다. 두 입력 모두 필수다.
- A6: 이 계산은 규제상 상한만 다룬다. DSR·소득 심사·은행별 내부 기준은 반영하지 않으며, 결과 카드에 한 줄로 알린다(범위 설명이지 법적 고지 문구가 아니다).
- A7: 규제 값은 이번 확인일(2026-10-21) 기준이다. 규제가 바뀌면 규제 파일과 `REGULATION_BASE_DATE`를 사람이 직접 고친다. 자동 갱신은 하지 않는다.
- A8: 이 스펙의 수치는 금융위 원문을 웹으로 추출해 확인한 것이다. 태스크 1-2에서 S1·S3 첨부 원본(PDF/hwpx)과 한 번 더 대조한 뒤 커밋한다. 자동 테스트(AC-2)는 스펙 표와 파일의 일치만 보장한다.
- A9: 사용자는 한 기기·한 브라우저에서 쓴다. 기기 간 동기화는 하지 않는다.
- A10: 이름 길이는 코드포인트 수로 센다. 같은 이름의 매물을 여러 개 저장할 수 있다(id로 구분).
- A11: draft는 입력 중인 금액 문자열을 그대로 저장한다. 임시 값이라 형태를 바꾸기 쉽고, 손상되면 기본값으로 시작한다.
- A12: "새 계산"은 금액과 `listingId`만 비우고 소재지·보유 상태는 유지한다("마지막 선택 기억"과 같은 원칙).
- A13: 저장 시트는 브라우저 히스토리에 넣지 않는다. 키보드 대응은 최소로 하고 `visualViewport` 처리는 하지 않는다. 쓰기 실패는 저장 시트 안 문구로 알린다.
- A14: "최근 저장순"에서는 미확인 매물을 따로 뒤로 보내지 않는다(자기자금을 쓰지 않는 정렬이라서).

## 결정됨

미결정 항목은 없다. 모두 팀 토론에서 채택됐고 근거는 각 ADR에 있다. 이 스펙의 해당 절은 아래 결정을 따른다.

| 항목                   | 결정                                                                                                                                                                                                            | ADR                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| D1 저장 위치           | localStorage(배열 JSON). 버전 필드 없음, 전체 단위 손상 판정, 손상 시 `reset` 외 쓰기 차단, 초기화 전 원문 복사 버튼                                                                                            | [ADR-001](../decisions/001-storage.md)             |
| D2 금액 단위           | 만원 정수 한 칸(최대 9자리) + 한글 보조 표시. LTV는 0~100 정수 퍼센트, `Math.floor(base * rate / 100)`                                                                                                          | [ADR-002](../decisions/002-money-unit.md)          |
| D3 디렉토리            | `containers/Mortgage/{Calculator,Listings}` + `lib/{constants,utils,types}` + `hooks/` + `@/` alias. 규제 값은 `loanRegulations.ts` 한 파일, `satisfies Regulations`(`as const` 금지), react-query·axios 미사용 | [ADR-003](../decisions/003-directory.md)           |
| D4 화면 전환           | 라우터 없이 해시 `#/`, `#/listings` 두 개를 `useSyncExternalStore`로 구독                                                                                                                                       | [ADR-004](../decisions/004-routing-state.md)       |
| D5 구간 판단 가격      | `max(매매가, KB시세)`로 판단, 사용한 가격 표시, 두 가격이 다른 구간이면 경계 알림. **검토 권장 결정**(1차 출처 정의 없음)                                                                                       | [ADR-005](../decisions/005-cap-reference-price.md) |
| D6 부대비용            | 이번에는 제외. 라벨을 "필요한 자기자금(부대비용 제외)"로 쓴다                                                                                                                                                   | [ADR-006](../decisions/006-extra-costs.md)         |
| D7 저장 내용           | 입력만 저장하고 표시할 때 현재 규제로 다시 계산. 정렬·카드 요약 함수는 `regulations`를 인자로 받는다                                                                                                            | [ADR-007](../decisions/007-store-inputs-only.md)   |
| D8 UI 테스트           | `@testing-library/react` + `jsdom` 도입(파일 단위 jsdom, 통합 테스트 5개 이내). `parseRoute`·`parseDraft`·`validateAmount`·정렬은 순수 함수로 뺀다. 결과 카드는 `regulations`를 prop으로 받는다                 | [ADR-008](../decisions/008-ui-testing.md)          |
| N1 계산 화면 상태 출처 | 계산 화면은 항상 draft만 본다. 카드를 누르면 draft를 `{ listingId, 저장본 값 }`으로 바꾸고 `#/`로 push. `#/listing/{id}` 라우트 없음                                                                            | [ADR-004](../decisions/004-routing-state.md)       |
| N2 보유 상태 UI        | `borrower` 4값과 1:1인 라디오 하나. 초기값 규제지역·무주택, 결과 카드 상단에 조건 요약, 이후 마지막 선택은 draft가 기억                                                                                         | [ADR-009](../decisions/009-borrower-ui.md)         |
| N3 id 생성             | `crypto.getRandomValues` 16바이트 hex. 스토어 팩토리가 `{ storage, createId, now }`를 받는다. id 검증은 비어 있지 않은 문자열까지                                                                               | [ADR-010](../decisions/010-id-generation.md)       |
| N4 목록 스크롤 복원    | 언마운트 때 모듈 변수에 저장하고 마운트 때 복원                                                                                                                                                                 | [ADR-004](../decisions/004-routing-state.md)       |
| N5 저장 형식 변경      | 버전 필드 없이 배열 JSON 그대로. 마이그레이션은 하지 않는다                                                                                                                                                     | [ADR-001](../decisions/001-storage.md)             |

## 사용자 확인 필요

- U1: 서민·실수요자 우대(규제지역 LTV 40% 대신 60%)를 조건에 넣을지. 요청하신 조건 목록(규제지역, 생애최초, 무주택/1주택)에는 없어서 이번 범위에서 뺐습니다. 다만 해당 요건(부부합산 소득 9천만 이하, 주택가 8억 이하, 무주택세대주)에 맞는 사용자에게는 이 계산기가 한도를 실제보다 낮게, 자기자금을 높게 보여줍니다. 주 사용자가 이 요건에 해당한다면 1순위로 넣어야 합니다.

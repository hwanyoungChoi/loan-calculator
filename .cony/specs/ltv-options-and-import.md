# LTV 옵션과 매물 데이터 가져오기

작성일: 2026-10-22 · 브랜치: `cony/ltv-options-and-import` · 선행 스펙: [mortgage-calculator.md](mortgage-calculator.md) (데이터 모델·모듈 계약·규제 파일 구조는 그대로 따른다)

개정: 팀 검토(backend-dev·client-dev·tester)와 결정 D1~D8·D10([ADR-011~018](../decisions/011-server-pages-functions.md))을 반영했다. 검토 원문은 `.cony/reviews/spec-ltv-options-and-import-*.md`에 있다. ADR-001·003·008 개정 문서는 리드가 이미 반영했으므로 이 스펙의 태스크에 넣지 않는다.

## 목표

규정상 우대 조건(서민·실수요자)과 은행 상담에서 받은 LTV를 계산에 넣을 수 있게 해서, 규제 표 4칸에 맞지 않는 사용자도 실제에 가까운 한도와 자기자금을 본다. 매물 현장에서 숫자를 손으로 옮기는 수고를 줄이기 위해 두 가지를 더한다. 하나는 그 지역·단지의 최근 실거래가를 참고로 보여 주는 것이고, 다른 하나는 네이버부동산 공유 텍스트를 붙여 넣으면 매매가와 이름을 채워 주는 것이다.

## 사용자 시나리오

1. 부부합산 연소득 8천만원인 무주택 세대주가 규제지역의 7억원 아파트를 본다. 보유 상태에서 "무주택·서민실수요자"를 고르면 요건 안내(부부합산 연소득 9천만원 이하, 주택가격 8억원 이하, 무주택세대주)가 보인다. 결과 카드에는 LTV 60%와 그 출처·시행일이 나오고, "소득·무주택세대주 요건은 확인하지 않았습니다"가 함께 보인다.
2. 같은 사용자가 매매가 85000, KB시세 84000을 입력하면 "주택가격 8억원 초과로 서민·실수요자 우대 대상이 아닙니다"가 뜨고 한도와 자기자금은 "—"로 바뀐다. 고정 요약 바에도 "요건 미충족"이 보인다. 보유 상태를 "무주택"으로 바꾸면 다시 계산된다.
3. 은행 상담에서 "LTV 70%까지 된다"는 말을 들었다. "LTV 직접 입력"을 켜고 70을 넣으면 결과 카드의 LTV 줄에 "사용자 지정 LTV 70%"가 나오고, 옆에 "규제 기준 40%"가 회색으로 함께 보인다. 요약 바에도 "사용자 지정 LTV 70%"가 보인다. 한도 상한(6억 등)은 그대로 적용된다. 저장하면 목록 카드에 "사용자 지정" 배지가 붙는다. "새 계산"을 누르면 직접 입력은 꺼진다.
4. 네이버부동산 앱에서 매물 "공유 → 복사"를 하고 계산기의 "붙여넣기로 채우기"를 누른다. 텍스트를 붙이면 곧바로 "매매가 12억 5,000만원 · 래미안OO · 84㎡"라는 미리보기가 뜬다. "적용"을 누르면 매매가가 채워지고 KB시세는 비워지며(편집 중이던 매물과의 연결도 풀린다), 저장할 때 이름 칸에 "래미안OO 84㎡"가 제안된다. 포커스는 KB시세 칸으로 간다. KB시세는 직접 입력한다.
5. 같은 화면에서 "이 지역 실거래가"를 열고 서울특별시 → 강남구를 고른다(단지명 칸에는 붙여넣기에서 읽은 단지명이 미리 들어가 있다). 최근 3개월 계약 건이 계약일, 전용면적, 층, 거래금액 순으로 나온다. 다음 날 다시 열면 강남구가 그대로 선택돼 있다. 저장 매물을 열었다 돌아와도 그렇다.

## 참고한 사례

- **금융위원회 「10.15 대책 관련 FAQ」 Q4 표** ([fsc.go.kr/po020201/85466](https://fsc.go.kr/po020201/85466)): 차주 유형(일반, 생애최초, 서민·실수요자) × 비규제/규제지역 표. 1차와 같은 "차주 유형 × 지역" 행렬에 서민·실수요자 행을 하나 더한다. 요건은 각주 5)에 있으므로 규제 파일에 데이터로 둔다.
- **뱅크몰 아파트별 주담대 리포트** ([bank-mall.co.kr/plus/blog/12619](https://www.bank-mall.co.kr/plus/blog/12619), 1차에서 참고): 계산 과정을 숨기지 않는다. 사용자 지정 LTV도 "적용 LTV" 줄을 바꾸기만 하고, 규제 값을 지우지 않고 나란히 보여 준다.
- **국토교통부 아파트 매매 실거래가 Open API** ([data.go.kr 15126468](https://www.data.go.kr/data/15126468/openapi.do), [15126469](https://www.data.go.kr/data/15126469/openapi.do)): 조회 단위가 "시군구 5자리 × 계약년월"이다. 화면 입력도 시도 → 시군구 → (단지명 필터)로 맞춘다.
- **행정표준코드관리시스템 법정동코드** ([code.go.kr 법정동코드목록조회](https://www.code.go.kr/stdcode/regCodeL.do)): API 문서가 LAWD_CD의 출처로 지정한 곳이다. "법정동 코드 전체자료" 내려받기와 폐지일 필드가 있어서, 정적 목록을 만들고 기준일을 붙이는 근거로 쓴다.
- **Cloudflare Pages Functions 바인딩 문서** ([developers.cloudflare.com/pages/functions/bindings](https://developers.cloudflare.com/pages/functions/bindings/)): 시크릿은 대시보드의 Variables and Secrets에서 Encrypt로 등록하고, 로컬에서는 `.dev.vars`에 둔다(git 제외). 코드에서는 `context.env`로 읽는다. 시크릿은 그것을 쓰는 배포보다 먼저 등록해야 한다.
- **토스 × 삼성 메시지 송금 버튼** ([toss.im/tossfeed/article/hello-samsung](https://toss.im/tossfeed/article/hello-samsung)): 자유 텍스트에서 구조화된 값(계좌번호)을 찾아 행동 버튼으로 제안한다. 붙여넣기 파서도 값을 바로 덮어쓰지 않고, 찾은 값을 미리보기로 보여 준 뒤 사용자가 확인하면 적용한다.
- **네이버 대 다윈프로퍼티 항소심** ([한국경제 2026-01-04](https://www.hankyung.com/article/202601040488i)): 특허법원은 네이버를 부동산 매물 DB의 제작자로 인정하고 DB 복제·전송 금지와 배상을 명령했다. 링크 가져오기(D9)를 판단할 때의 근거다.

## 범위

- 포함:
  - 보유 상태에 "무주택·서민실수요자" 추가(`borrower` 5번째 값). LTV 셀 3칸, 요건 데이터, 출처·시행일
  - 서민·실수요자 요건 중 앱이 판정할 수 있는 것(주택가격 8억원 이하)은 계산에서 검사한다. 소득과 무주택세대주는 안내 문구로 사용자가 스스로 확인한다.
  - LTV 직접 입력(0~100 정수 %). 결과에서 "사용자 지정 LTV"로 표시하고, 같은 조건의 규제 LTV를 함께 보여 준다. 한도 상한은 유지한다(ADR-013). 저장 매물에도 남긴다(ADR-012).
  - 서버 코드 첫 도입: Cloudflare Pages Functions(ADR-011) 엔드포인트 1개 `GET /api/apt-trades`. 서비스키는 서버 시크릿이다. 호출 증폭을 막기 위해 `lawdCd` 목록 검증과 달 단위 Cache API 캐시를 넣는다.
  - 실거래가 시트: 시도 → 시군구 선택, 단지명 필터, 최근 3개월, 로딩·빈 상태·오류 상태, 마지막 시군구 기억(별도 저장 키)
  - 네이버부동산 공유 텍스트 붙여넣기 → 매매가와 저장 이름 제안, 실거래가 단지명 채우기. 입력 즉시 미리보기, 적용 버튼으로 반영하며, 파싱 실패 처리를 포함한다.
  - 로컬 개발(`wrangler pages dev` + `.dev.vars`)과 CI 검증 경로(dev 서버 연기 테스트 포함)
- 범위 밖:
  - **매물 링크 가져오기(네이버부동산·호갱노노·KB부동산 서버 fetch)**: 조사 결과 기술·약관·판례 리스크가 커서 제외를 추천했고, 사용자 확인(U2)을 기다리는 동안 범위에서 뺀다(D9). 붙여넣기로 대체한다.
  - 부부 공유 저장(D1 + Access), DSR, 부대비용(사용자 지정)
  - 실거래가로 KB시세나 매매가를 자동으로 채우는 것(참고 표시만 한다)
  - 엔드포인트 호출 제한(rate limit, 커스텀 도메인의 WAF 규칙), Preview 환경 접근 제한, 연립·다세대·오피스텔 실거래가
  - 주소나 시군구로 규제지역 자동 판정
  - 매물에 면적·원본 링크 저장(데이터 모델 확장, 다음 단계)
  - 사용자 지정 한도 상한

## 규제 값 (2026-10-22 확인)

### 확인 경로

1차 스펙의 S1~S6는 그대로 둔다. 이번에 새로 쓴 근거는 아래와 같다.

| ID  | 1차 출처                                                                                                                   | 게시일     | 시행일                             | 이번 스펙에 쓴 내용                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S3  | 금융위 「10.15 대책 관련 FAQ」 Q4 [fsc.go.kr/po020201/85466](https://fsc.go.kr/po020201/85466)                             | 2025-10-17 | 규제지역 대출규제는 2025-10-16(S2) | 서민·실수요자 행: LTV 비규제 70% → 규제지역 60%, DTI 60% 좌동, 최대한도는 일반과 같은 구간(15억 이하 6억 / 15~25억 4억 / 25억 초과 2억). 각주 5): "①부부합산 연소득 9천만원 이하, ②주택가격 8억원 이하, ③무주택세대주 요건을 모두 충족하는 경우" |
| S4  | 금융위 「규제지역 추가 지정 관련 긴급 가계부채 점검회의」 [fsc.go.kr/no010101/87222](https://www.fsc.go.kr/no010101/87222) | 2026-06-30 | 2026-07-01                         | 새 규제지역(동탄구·기흥구·구리시)에도 "旣 마련된 규정"을 그대로 적용한다. 서민·실수요자 수치를 바꾸는 문장은 없다                                                                                                                                |
| S6  | 금융위 「2026년 9월 가계대출 동향 및 가계부채 점검회의」 [fsc.go.kr/no010101/87939](https://www.fsc.go.kr/no010101/87939)  | 2026-10-15 | —                                  | LTV·한도 변경 없음(1차에서 확인). 2026-10-22에 다시 검색했고, 이후 금융위 LTV 개정 발표는 찾지 못했다                                                                                                                                            |

교차 확인(2차, 수치 근거로는 쓰지 않음): [파이낸셜뉴스 2025-10-17](https://www.fnnews.com/news/202510171815396558)이 금융위 설명을 "서민·실수요자(부부합산 연 소득 9천만원 이하·주택가격 8억원 이하·무주택세대주)가 … 규제지역에선 자동으로 LTV가 70%에서 60%로 축소된다"로 보도했다. S3 표와 일치한다.

### 서민·실수요자 행 (`borrower: "noHomePreferred"`)

| 소재지        | LTV                                                             | 근거                                                                                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 규제지역      | **60%** (시행 2025-10-16)                                       | S3 Q4 표 "규제지역" 열                                                                                                                                                                                                                                      |
| 수도권 비규제 | **70%** (시행 2025-10-16)                                       | S3 Q4 표 "10.15 이전" 열. 10·15로 새로 지정된 지역은 모두 그 전에 수도권 비규제였으므로, 이 열이 수도권 비규제 값이다                                                                                                                                       |
| 비수도권      | **`null`(미확인)**. 원문 대조 후 70%로 바꿀 수 있다(태스크 1-2) | S3 표의 비교 열이 "비규제지역 일반"인지 "10·15 이전 해당 지역"인지는 웹 추출로 확정할 수 없다(표가 깨져 있음). 일반 무주택 70%보다 낮을 이유는 없지만, 규칙상 수치를 지어내지 않는다. 미확인이어도 사용자는 "무주택"이나 "LTV 직접 입력"으로 계산할 수 있다 |

- 한도 상한: 기존 `LOAN_CAP`을 그대로 적용한다(S3 최대한도 열이 일반과 같다). 요건상 주택가격이 8억원 이하이므로 실제로는 늘 첫 구간(6억)이다. 60% × 8억 = 4억 8천만원이라 상한에 닿지 않는다.
- 생애최초와의 관계: 규제지역 생애최초는 70%(S1·S3)로 서민·실수요자 60%보다 높다. 둘 다 해당하면 "무주택·생애최초"를 고르라는 안내를 라디오 설명에 단다. 두 우대를 합치는 규정은 확인하지 못했으므로 합산하지 않는다.
- 1주택 처분조건부에는 적용하지 않는다. 요건 ③이 무주택세대주이기 때문이다.

### 요건 데이터 (`PREFERRED_BORROWER_REQUIREMENTS`)

```ts
{
  maxHousePrice: 80000,          // 만원. S3 각주 5) ②
  maxCoupleIncome: 9000,         // 만원. 각주 5) ①. 앱이 판정하지 않고 안내 문구에만 쓴다
  householdRequirement: "무주택세대주", // 각주 5) ③. 안내 문구에만 쓴다
  effectiveDate: "2025-10-16",
  sourceUrl: S3.url,
}
```

- 주택가격 판정에 쓰는 가격: S3에 "주택가격"의 정의가 없다. [ADR-005](../decisions/005-cap-reference-price.md)와 같은 이유로 `selectCapReferencePrice`(= max(매매가, KB시세))를 쓰고, 화면에 어느 가격으로 판정했는지 표시한다(가정 A3). 지역은 보지 않는다. 수도권 비규제에서도 80001은 `ineligible`이다.
- 경계: `price <= 80000`이면 요건을 충족한다. 80000은 충족이고 80001은 미충족이다.

### 확인 강도 메모

- 60%, 9천만원, 8억원, 무주택세대주는 S3 웹 본문에서 읽었다. 그런데 이 S3 표는 1차 때와 같이 웹 추출에서 열 순서가 깨진다. 각주 5)는 문장이라 깨지지 않았지만, "60%"가 서민·실수요자 행 규제지역 칸이라는 것은 추출 순서와 2차 보도를 함께 보고 판단한 것이다. 이번 세션은 첨부 PDF(`/comm/getFile?srvcId=BBSTY1&upperNo=85466&fileTy=ATTACH&fileNo=1`)를 받았지만 바이너리라 읽지 못했다. 태스크 1-2에서 사람이 PDF를 열어 대조한다(U4).
- S3 각주 6)("부부합산 연소득 7천만원 이하, 주택가격 6억원 이하, 무주택자")은 보금자리론 "실수요자" 요건이다. 은행 주담대 서민·실수요자 요건과 섞지 않는다.
- 2차 자료 중 "주택가격 5억원·연소득 6천만원·LTV 10%p 가산"을 서민·실수요자 요건으로 소개하는 기사([insight.co.kr](https://www.insight.co.kr/news/269151))가 있다. 이는 과거 체계로 보이며 S3와 다르므로 쓰지 않는다.
- `REGULATION_BASE_DATE`는 `"2026-10-22"`로 올린다. 기존 셀은 바뀌지 않았다(S6 이후 개정 발표 없음, 이번 검색으로 확인).

## 데이터 모델

서버 DB는 없다. 저장은 계속 localStorage다([ADR-001](../decisions/001-storage.md), 보강: [ADR-012](../decisions/012-custom-ltv-storage.md)).

### 타입 변경 (`src/lib/types/`)

```ts
type Borrower = "noHome" | "firstHome" | "noHomePreferred" | "oneHomeDisposal" | "oneHomeKeep";
// 화면 순서: 무주택 / 무주택·생애최초 / 무주택·서민실수요자 / 1주택 처분조건부 / 1주택 미처분

type PreferredBorrowerRequirements = {
  maxHousePrice: number; // 만원
  maxCoupleIncome: number; // 만원
  householdRequirement: string;
  effectiveDate: string;
  sourceUrl: string;
};
type Regulations = {
  /* 기존 필드 */ preferredBorrower: PreferredBorrowerRequirements;
};

// 두 타입 모두 같은 표현이다: 키가 없으면 규제 LTV. null은 쓰지 않는다(ADR-012).
type LoanInput = {
  salePrice: number;
  kbPrice: number;
  region: Region;
  borrower: Borrower;
  customLtvRate?: number; // 0~100 정수
};
// Listing은 구조적으로 LoanInput을 포함한다. listing을 calculateLoan에 그대로 넘겨도 된다
// (sortListings, ListingCard가 그렇게 한다).

// 규제 기준 병기용: 사용자 지정 LTV가 없었다면 이 조건이 어떻게 계산됐을지
type RegulationOutcome =
  { status: "ok"; rate: number } | { status: "ineligible" } | { status: "unconfirmed" };
type AppliedLtv =
  | { source: "regulation"; rate: number }
  | { source: "custom"; rate: number; regulation: RegulationOutcome };

// 1차 LoanResultBase에서 `ltv: LtvCell`을 빼고 나머지를 그대로 둔다. 필드 이름이 ltv → appliedLtv로 바뀐다.
type LoanResultBase = {
  collateralBase: number;
  collateralSource: PriceSource;
  cap: CapResult | null; // 상한 없는 지역(비수도권)에서만 null
};

type LoanResult =
  | (LoanResultBase & {
      status: "ok";
      appliedLtv: AppliedLtv;
      ltvAmount: number;
      loanLimit: number;
      ownFunds: number;
    })
  | (LoanResultBase & {
      status: "unconfirmed";
      appliedLtv: null;
      ltvAmount: null;
      loanLimit: null;
      ownFunds: null;
    })
  | (LoanResultBase & {
      status: "ineligible";
      reason: "housePriceOverLimit";
      eligibilityPrice: number;
      eligibilityPriceSource: PriceSource;
      appliedLtv: null;
      ltvAmount: null;
      loanLimit: null;
      ownFunds: null;
    });
```

- `ltv` → `appliedLtv` 이름 변경은 `ResultCard`, `RegulationBasis`, `LtvValue`, `calculateLoan.test`, `ResultCard.test`에 파급된다. 태스크 1-1이 한 번에 고친다.
- `LoanResult["status"]`로 분기하는 곳(`ResultCard`, `SummaryBar`, `ListingCard` 배지, `sortListings`)은 `Record<LoanResult["status"], …>` 레지스트리로 묶어, 상태 누락이 타입 검사에서 걸리게 한다. `LtvValue`는 `AppliedLtv["source"]`별 레지스트리로 둔다.

계산 규칙(우선순위 순서, ADR-013):

1. `typeof customLtvRate === "number"`이면 `status: "ok"`, `appliedLtv.source: "custom"`이다. 요건 검사와 미확인 검사를 건너뛴다. 사용자가 은행 상담값을 직접 넣었기 때문이다. 상한(`cap`)은 규제대로 적용한다. `regulation`에는 아래 2~4와 같은 규칙으로 구한 규제 결과(`ok`+rate / `ineligible` / `unconfirmed`)를 담는다. 판정은 `typeof === "number"` 하나로만 한다(`!== null`로 쓰지 않는다. 키 없는 1차 매물이 `undefined`라서 전부 사용자 지정으로 계산되는 버그가 난다).
2. `borrower === "noHomePreferred"`이고 `selectCapReferencePrice(...) > maxHousePrice`이면 `status: "ineligible"`이다.
3. 규제 셀 `rate === null`이면 `status: "unconfirmed"`다(1차 규칙 그대로).
4. 나머지는 `status: "ok"`, `appliedLtv.source: "regulation"`이다.

규칙 2·3은 `evaluateRegulation(input, regulations): RegulationOutcome` 한 함수에 두고 `calculateLoan`이 규칙 1의 `regulation` 값과 일반 경로에 함께 쓴다. 순서가 결과를 정한다. 비수도권·서민·실수요자(셀 `null`)에서 90000/90000은 `ineligible`, 70000/70000은 `unconfirmed`다.

`ineligible`과 `unconfirmed`는 모두 `collateralBase`와 `cap`을 계산해서 돌려준다. `ineligible`의 `cap`은 `max(매매가, KB시세)` 기준 구간이다.

### Listing (저장 매물)

| 필드                     | 변경                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| borrower                 | 허용 값이 5개로 는다. 기존 데이터는 4값의 부분집합이라 그대로 유효하다                                                                                                                                                                                                                                                                              |
| `customLtvRate?: number` | **선택 필드로 추가**(ADR-012). 키가 없으면 규제 LTV다. 키가 있으면 `typeof === "number"` → `Number.isInteger` → 0~100 순서로 검증하고, 하나라도 아니면 1차 규칙대로 목록 전체가 `corrupt`다. 규제 LTV로 저장할 때는 키를 아예 쓰지 않는다. 사용자 지정이던 매물을 규제로 되돌려 저장하면 이전 키가 남지 않는다(`{...old}` 스프레드로 남기지 않는다) |

- 변환 지점은 한 곳이다. `toLoanInput`(draft → `LoanInput`)은 사용자 지정 값이 유효할 때만 `customLtvRate` 키를 넣는다. `saveListing`은 `{ ...loanInput, name }`을 저장하므로 키 생략 규칙이 별도 변환 없이 지켜진다. `isSameAsListing`만 `?? null`로 비교한다(키 없음 ≡ `null`).
- 저장 키와 형식은 `loan-calculator/listings` 배열 JSON 그대로이고 버전 필드는 없다. 기존 사용자의 목록은 그대로 읽힌다(AC-3에서 고정 문자열로 검증).
- 롤백 위험(ADR-012에 기록, 받아들임): `noHomePreferred`나 `customLtvRate`를 저장한 뒤 배포를 이전 버전으로 되돌리면 옛 코드가 목록 전체를 `corrupt`로 판정한다. 데이터 소실은 아니고 원문 복사가 가능하다. 릴리스 메모에 남긴다.
- 정렬(`sortListings`): `ineligible`은 `unconfirmed`와 같이 "계산 불가"로 보고 자기자금순에서 맨 뒤에 둔다(그 둘끼리는 `createdAt` 내림차순). 사용자 지정 LTV 매물은 자기 값으로 정상 정렬된다.
- "저장됨" 판정(`saveButtonState`)의 비교 대상에 `customLtvRate`가 들어간다. 정규화한 숫자로 비교하므로 저장 70에서 입력을 `"70%"`로 고쳐 써도 "저장됨"이고, 값이 바뀌면 다시 활성화된다. `ineligible`과 `unconfirmed`도 입력이 유효하면 저장할 수 있다(1차 규칙 그대로).

### Draft

```ts
type Draft = {
  salePrice: string;
  kbPrice: string;
  region: Region;
  borrower: Borrower;
  listingId: string | null;
  customLtv: string | null; // null = 직접 입력 꺼짐, 문자열 = 입력 중인 값
};
```

- 새 필드는 `customLtv` 하나다. 시군구 기억과 단지명 필터는 draft에 넣지 않는다(아래 "조회 기억").
- 배포 직후 기존 draft는 `parseDraft` 스키마 검사에서 한 번 기본값으로 초기화된다. 1차 A11("임시 값이라 잃어도 괜찮다")에 따라 받아들인다(가정 A6). 영향: 입력 중이던 금액, 마지막 소재지·보유 상태 선택, `listingId`(편집 중 연결)가 한 번 사라진다. 기본이 규제지역·무주택이므로 이전에 비규제를 골랐던 사용자는 조건 요약을 확인해야 한다. 저장 목록은 영향이 없다. 누락 필드를 채우는 호환 코드는 두지 않는다.
- 저장 매물을 열면(`listingToDraft`) `customLtv`는 그 매물의 `customLtvRate`가 있을 때 그 숫자의 문자열, 없으면 `null`이다.
- **"새 계산"은 금액과 `listingId`를 비우고 `customLtv`를 `null`로 끈다**(ADR-013). 소재지·보유 상태는 1차 A12대로 유지한다. 은행 상담 LTV는 그 매물 그 은행의 값이라 다음 매물에 남으면 과대 표시가 되기 때문이다.
- 스위치를 껐다 켜면 입력은 빈 값이다(`null`이면 문자열이 없다).

### 조회 기억 (`loan-calculator/trade-lookup`, ADR-017)

- 실거래가 시트에서 마지막으로 고른 시군구 5자리만 별도 키에 JSON `{ "lawdCd": "11680" }`로 저장한다. draft와 분리해서 `listingToDraft`의 draft 통째 교체와 "새 계산"이 이 값을 지우지 않는다.
- 시군구를 고르는 즉시 저장한다("조회" 클릭과 무관). 읽을 때 JSON·형태가 틀렸거나 `lawdCd`가 `LAWD_CODES`에 없으면 "기억 없음"으로 본다(이 키만 영향. 저장 목록·draft와 무관).
- 단지명 필터는 저장하지 않는다. 시트의 제출된 파라미터 상태이고, 새 계산과 매물 열기에서 비운다. 붙여넣기 적용이 단지명을 읽었으면 계산 화면 상태에 "단지명 힌트"로 두었다가 시트가 열릴 때 단지명 칸에 넣는다(같은 시점에 비운다).

### 규제 파일 (`src/lib/constants/loanRegulations.ts`)

- `LTV_TABLE`에 `noHomePreferred` 행 3칸을 추가한다(위 표). 셀은 15개다.
- `PREFERRED_BORROWER_REQUIREMENTS`를 추가하고 `LOAN_REGULATIONS.preferredBorrower`에 넣는다.
- `REGULATION_BASE_DATE = "2026-10-22"`
- 규제 값은 이 파일 한 곳에만 둔다(CLAUDE.md). 화면 문구 "부부합산 연소득 9천만원 이하"도 이 객체에서 `formatManwon`으로 만든다.

### 시군구 코드 (`src/lib/constants/lawdCodes.ts`, ADR-016)

- `LAWD_CODES: { code: string; sido: string; sigungu: string }[]`, `LAWD_CODES_BASE_DATE`, `LAWD_CODES_SOURCE_URL`(code.go.kr)을 둔다. 클라이언트와 서버가 이 한 파일을 함께 쓴다(서버는 상대 경로 import).
- 생성: code.go.kr "법정동 코드 전체자료"에서 폐지되지 않은 시군구 단위(10자리 중 뒤 5자리가 `00000`) 코드를 뽑는다. 일반구가 있는 시는 구 단위만 둔다(예: 수원시 장안구 `41111`, 가정 A7). 시도 → 시군구 순으로 정렬을 고정한다(select 노출 순서). 세종처럼 시군구가 없는 시도는 `sigungu`에 시도 이름을 그대로 쓴다(가정 A14). 생성 스크립트는 `scripts/`에 두고, 결과 상수 파일을 커밋한다. 원본 파일은 커밋하지 않는다.
- 규제 값이 아니므로 `loanRegulations.ts`에 넣지 않는다.

## API 계약

### HTTP: `GET /api/apt-trades`

| Method | Path              | Request (query)                                                                                                                                                        | Response 200                                                                       | 에러    |
| ------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| GET    | `/api/apt-trades` | `lawdCd`: 필수, `^\d{5}$`이고 `LAWD_CODES`에 있는 값 · `months`: 선택, `^[1-6]$`, 기본 3 · `aptName`: 선택, trim 후 NFC로 정규화한 0~40자(코드포인트, `[...s].length`) | `AptTradesResponse`. `Cache-Control: public, max-age=600` (오류 응답은 `no-store`) | 아래 표 |

```ts
type AptTrade = {
  aptName: string;
  umdName: string | null; // 법정동. 같은 이름 단지 구분용
  exclusiveArea: number; // ㎡, 응답 소수 그대로 ("84.9700" → 84.97)
  floor: number | null;
  dealAmount: number; // 만원 정수. trim 후 쉼표 제거 ("  115,000" → 115000)
  dealDate: string; // YYYY-MM-DD (dealYear/dealMonth/dealDay 조합, 0 채움)
};
type AptTradesResponse = {
  lawdCd: string;
  months: string[]; // 조회한 YYYYMM, 최신 먼저. 기준은 서버 시각의 KST 달
  items: AptTrade[]; // 해제 거래 제외, aptName 필터 적용 후, dealDate 내림차순 → 같은 날 dealAmount 내림차순 → 업스트림 순서(안정 정렬)
  source: { name: "국토교통부 아파트 매매 실거래가"; url: string };
};
type ApiError = {
  error:
    | "invalidParams"
    | "methodNotAllowed"
    | "notConfigured"
    | "quotaExceeded"
    | "rateLimited"
    | "upstream"
    | "upstreamTimeout"
    | "internal";
  message: string;
};
```

- **`totalCount`는 응답에 없다.** 건수는 `items.length`다(화면 "N건"과 "더 보기" 경계가 이 값이다). 업스트림의 `totalCount`는 서버 안에서만 `upstreamTotal`이라는 이름으로 페이지 순회 종료 조건에 쓴다.
- `jibun`, `buildYear`, `aptDong`은 응답에 넣지 않는다(화면이 쓰지 않고, 동 정보는 공개 범위 설명과 충돌할 수 있다).
- 응답 전량을 주고 화면이 50건씩 자른다. `limit` 파라미터는 두지 않는다.

| 상황                                                                                                                                                                                            | HTTP | `error`            | 비고                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `lawdCd` 누락·형식 오류·`LAWD_CODES`에 없음, `months`가 `^[1-6]$`가 아님(빈 문자열·공백 포함), `aptName` 41자 이상, 같은 키 중복(`lawdCd=1&lawdCd=2`)                                           | 400  | `invalidParams`    | `message`에는 파라미터 **이름**만 적고 입력값을 되돌려 주지 않는다. 알 수 없는 쿼리 키는 무시한다             |
| GET 외 메서드                                                                                                                                                                                   | 405  | `methodNotAllowed` | `Allow: GET`. 본문도 `ApiError`                                                                               |
| `env.MOLIT_SERVICE_KEY`를 `trim()`한 값이 비어 있음                                                                                                                                             | 503  | `notConfigured`    | 사용자 시크릿 등록 전 상태(U1)                                                                                |
| 업스트림 코드 20·30·31(접근 거부/키 없음, 키 미등록, 키 기한 만료)                                                                                                                              | 503  | `notConfigured`    | 운영자가 고칠 문제다. `message`에 업스트림 코드만 담는다. 신규 키는 승인 직후 활성화 지연으로 30이 날 수 있다 |
| 업스트림 코드 22(일일 호출량 초과)                                                                                                                                                              | 429  | `quotaExceeded`    | 클라이언트: "오늘 조회 한도를 넘었습니다. 내일 다시 시도하세요"                                               |
| 업스트림 코드 23(초당 호출량 초과)                                                                                                                                                              | 429  | `rateLimited`      | `Retry-After: 2`. 서버 자동 재시도는 하지 않는다. 클라이언트: "잠시 뒤 다시 시도하세요"                       |
| 업스트림 그 밖의 오류 코드(01·04·05·10·12·29 등), XML/JSON이 아님·빈 본문·HTML 본문, HTTP 비정상이면서 오류 코드 없는 본문, 네트워크 오류(fetch `TypeError`), 필수 필드 누락, 달당 5페이지 초과 | 502  | `upstream`         | `message`에 업스트림 코드(있을 때)만 담는다. 원문 응답·요청 URL·예외 메시지는 담지 않는다                     |
| 요청 전체 타임아웃(공유 신호 하나, 15초)                                                                                                                                                        | 504  | `upstreamTimeout`  | `err.name === "TimeoutError"`(또는 `AbortError`)로 판정                                                       |
| 예상 못 한 예외                                                                                                                                                                                 | 500  | `internal`         | 핸들러의 try/catch 한 겹. 예외 `message`는 응답에 넣지 않고 코드만 로그에 남긴다                              |

- 모든 응답 본문은 `Content-Type: application/json; charset=utf-8`과 `X-Content-Type-Options: nosniff`를 단다. CORS 헤더는 추가하지 않는다(동일 출처만 쓴다).
- **서비스키는 응답, 오류 메시지, 로그 어디에도 남기지 않는다.** 업스트림 URL을 `console.*`에 넘기지 않는다. fetch 오류의 `message`(키가 든 URL이 들어갈 수 있다)는 응답에 넣지 않는다.
- **`aptName` 필터**: 질의와 단지명 양쪽에 `normalize("NFC")`를 적용하고, 양쪽의 모든 공백을 지운 뒤 대소문자를 무시한 부분 일치로 거른다(`래미안 OO` ↔ `래미안OO`, `e편한세상` ↔ `E편한세상`). 서버에서 거른다.
- **페이지 순회**: 달마다 `numOfRows`를 크게 잡아(가정 A8: 1000) `upstreamTotal`에 도달할 때까지 `pageNo`를 올린다. 안전 상한은 달당 5페이지이고, 5페이지를 읽고도 도달하지 못하면 502 `upstream`이다. 여러 달은 병렬로 호출한다. 최악은 6달 × 5페이지 = 30 서브요청이라 Workers 무료 한도(50) 안이다.
- **여러 달 부분 실패**: 한 달이라도 실패하면 전체 실패다(부분 성공으로 200을 주지 않는다). 달마다 실패 종류가 다르면 **429 > 504 > 502** 순으로 높은 쪽을 돌려준다(429 안에서는 `quotaExceeded`가 `rateLimited`보다 앞, 가정 A15). 20·30·31(503)은 키 문제라 모든 달에 같이 나오므로 섞이지 않는다고 본다.
- **타임아웃**: `AbortSignal.timeout(15_000)` 신호 하나를 요청 전체(모든 달·페이지)가 공유한다. 한 달이 느리면 전체를 504로 처리한다.
- **서버 캐시(ADR-011)**: Cache API(`caches.default`)에 달 단위 조회 결과(페이지를 합친 해제 제외 `AptTrade[]`)를 저장한다. 캐시 키는 가짜 URL `https://cache.internal/apt-trades/{lawdCd}/{YYYYMM}`이며 서비스키와 `aptName`을 넣지 않는다(`aptName`은 응답 단계 필터라 임의 문자열로 캐시를 우회하지 못하게 한다). TTL은 지난달 이전 24시간, 이번 달 30분이다. 성공만 저장한다. Cache API는 데이터센터 단위이고 전역 공유되지 않는다. `pages.dev`에서 동작하는지는 태스크 2-3에서 확인하고, 동작하지 않으면 캐시 없이 `lawdCd` 검증만으로 간다(가정 A12).

### 업스트림 (공식 문서로 확인한 것)

| 항목       | 값                                                                                                                                                                                                                                                        | 출처                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| API        | 국토교통부_아파트 매매 실거래가 **상세** 자료(ADR-015) / 같은 기관의 기본 자료                                                                                                                                                                            | [15126468](https://www.data.go.kr/en/data/15126468/openapi.do) / [15126469](https://www.data.go.kr/en/data/15126469/openapi.do) |
| 엔드포인트 | 상세 `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev` / 기본 `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade`                                                                               | 각 페이지 "Requested Link"                                                                                                      |
| 요청 변수  | `serviceKey`(필수, 포털 발급 키), `LAWD_CD`(필수, 법정동코드 10자리 중 앞 5자리, 예 11110), `DEAL_YMD`(필수, 계약년월 6자리, 예 201512), `pageNo`, `numOfRows`                                                                                            | 15126468 영문 페이지 요청 변수 표                                                                                               |
| 응답       | REST, XML. 최상위 `header`·`body`                                                                                                                                                                                                                         | 두 페이지 공통                                                                                                                  |
| 트래픽     | 개발계정 10,000(일). 운영계정은 활용사례를 등록하면 늘릴 수 있다. 심의는 개발·운영 모두 자동승인. 이용허락범위 "제한 없음", 무료                                                                                                                          | 두 페이지 공통                                                                                                                  |
| 에러 코드  | 01 APPLICATION_ERROR, 04 HTTP_ERROR, 05 SERVICETIMEOUT_ERROR, 10 INVALID_REQUEST_PARAMETER_ERROR, 12 NO_OPENAPI_SERVICE_ERROR, 20 SERVICE_ACCESS_DENIED/KEY_IS_NULL, 22 일일 호출 초과, 23 초당 호출 초과, 29 BLACKLIST_IP, 30 키 미등록, 31 키 기한 만료 | [15126468](https://www.data.go.kr/data/15126468/openapi.do)                                                                     |
| 공개 범위  | 층 정보만 제공하고, 소유권 이전등기를 마친 건만 동 정보를 추가로 공개한다                                                                                                                                                                                 | 두 페이지 설명                                                                                                                  |

**공식 문서로 확인하지 못한 것**(기술문서는 hwp라 읽지 못함). 2차 출처([datadoctorblog](https://datadoctorblog.com/2025/03/17/Py-Crawling-API-gov-APT-trade/)) 기준이며, 태스크 2-3에서 실제 응답으로 확정한다.

- 정상 응답 구조 `response/header/resultCode`(`000`), `body/items/item[]`, `body/totalCount`
- item 필드 `aptNm`, `umdNm`, `excluUseAr`, `floor`, `dealAmount`(앞뒤 공백과 쉼표가 든 문자열, 예 `"     115,000"`), `dealYear`/`dealMonth`/`dealDay`, `cdealType`(해제 여부), `cdealDay`, `aptSeq`, `aptDong`, `sggCd`
- 결과 0건일 때 `items`가 빈 문자열로, 1건일 때 `item`이 배열이 아닌 객체로 오는 포털 API의 흔한 패턴
- 게이트웨이 오류 응답 형식(`OpenAPI_ServiceResponse/cmmMsgHeader/returnReasonCode`로 오는지, `_type=json`을 요청해도 XML로 오는지, HTTP 200인지 비정상 상태인지)
- `numOfRows` 상한과 실제 반환 건수, `_type=json` 지원 여부
- 해제 거래 표시 값(`cdealType`이 `"O"`인지)
- Cloudflare 데이터센터 IP에서 호출이 받아들여지는지(A13)

### 모듈 계약

서버 모듈(`server/`, `functions/`)은 **상대 경로 import만** 쓴다(`@/` 별칭은 앱 tsconfig에만 있어 wrangler 번들러가 모른다). `server/`는 `PagesFunction` 타입과 `context`에 의존하지 않는다.

| 모듈             | 위치                                                       | 시그니처·규칙                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages 진입점     | `functions/api/apt-trades.ts`                              | `onRequest: PagesFunction<Env>`가 `handleAptTrades(context.request, context.env, { fetch, now: () => new Date(), cache: caches.default })`를 부르기만 한다. `Env`는 `src`가 아닌 곳에 손으로 쓴다: `interface Env { MOLIT_SERVICE_KEY?: string }`                                                                                                                           |
| 핸들러           | `server/aptTrades/handleAptTrades.ts`                      | `(request: Request, env: { MOLIT_SERVICE_KEY?: string }, deps: { fetch: typeof fetch; now: () => Date; cache: CacheLike \| null }) => Promise<Response>`. `deps`는 첫 줄에서 구조 분해해서 쓴다(`deps.fetch(url)`은 Workers에서 `Illegal invocation`이 날 수 있다). 가짜 fetch·고정 시각·가짜 캐시를 주입해 키·네트워크 없이 테스트한다. 모든 오류 응답이 `ApiError` 형태다 |
| 요청 검증        | `server/aptTrades/parseQuery.ts`                           | `URLSearchParams → { ok: true, lawdCd, months, aptName } \| { ok: false, message }`. 중복 키·`months` 정규식(`Number()` 변환, `parseInt` 금지)·`aptName` 코드포인트 수·NFC를 여기서 처리한다                                                                                                                                                                                |
| 조회 달          | `server/aptTrades/recentMonths.ts`                         | `(now: Date, count: number) => string[]`. KST(UTC+9) 기준. 예: `2026-01-15T00:00+09:00`, 3 → `["202601","202512","202511"]`. 경계는 AC-4에 있다                                                                                                                                                                                                                             |
| 업스트림 URL     | `server/aptTrades/buildUpstreamUrl.ts`                     | `URL` + `searchParams.set`으로 만든다. 키는 포털의 **Decoding** 키를 넣고 인코딩은 `URLSearchParams`에 맡긴다(Encoding 키를 넣으면 이중 인코딩된다, 가정 A9)                                                                                                                                                                                                                |
| 응답 파싱        | `server/aptTrades/parseTradesResponse.ts`                  | `(text: string) => { ok: true, items: AptTrade[], upstreamTotal: number } \| { ok: false, code: string \| null }`. 형식 중립 이름이다(ADR-015: 2-3에서 JSON이 되면 JSON, 아니면 `fast-xml-parser`로 `parseTagValue: false`, `item`은 항상 배열, 값은 trim). 필드 규칙은 아래. 첫 글자가 `<`이면 오류 코드를 읽는 경로가 있다(정규식 허용)                                   |
| 캐시             | `server/aptTrades/monthCache.ts`                           | 달 단위 get/put, TTL(지난달 이전 24h, 이번 달 30m), 키 URL 만들기. `cache`가 `null`이면 건너뛴다                                                                                                                                                                                                                                                                            |
| 응답 타입        | `src/lib/types/aptTrade.ts`                                | `AptTrade`, `AptTradesResponse`, `ApiError`. 서버는 type-only import로 같은 파일을 쓴다(계약의 원본은 한 곳)                                                                                                                                                                                                                                                                |
| HTTP 클라이언트  | `src/lib/api/client.ts`, `src/lib/api/queryClient.ts`      | `apiClient.get<T>(path, { params })` fetch 래퍼. 2xx가 아니면 `ApiError` 본문을 담은 오류를 던진다. 본문이 `ApiError`가 아니면(HTML 등) `internal`과 같은 취급을 하는 "알 수 없는 오류"로 던진다. `queryClient.ts`에 `QueryClient`(기본 `retry: false`). axios는 쓰지 않는다(ADR-014)                                                                                       |
| 조회 훅          | `src/containers/Mortgage/Calculator/hooks/useAptTrades.ts` | CONVENTIONS 형식: `aptTradeListQueryKey(params)` → `["aptTrade", "list", params]`, 비공개 `fetchAptTrades`, `useAptTrades(params \| null)`(`null`이면 `enabled: false`). `staleTime` 10분, `retry: false`("다시 시도" 버튼에 맡긴다). **실거래가 시트 컴포넌트 안에서만 호출한다**                                                                                          |
| 오류 문구        | `…/Calculator/describeTradesError.ts`                      | `(error: unknown) => string`. `notConfigured`, `quotaExceeded`, `rateLimited`, `upstreamTimeout`, `upstream`, 알 수 없는 본문·네트워크 실패를 문구로 바꾼다. 순수 함수다                                                                                                                                                                                                    |
| 행 표시          | `…/Calculator/formatTradeRow.ts`                           | `(trade: AptTrade) => { title, amount, detail }`. 윗줄 단지명 · 금액(`formatManwon`), 아랫줄 계약일 · 전용면적(정수면 `59㎡`) · 층(`null`이면 생략) · 법정동. 순수 함수다                                                                                                                                                                                                   |
| LTV 입력 검증    | `src/lib/utils/validateLtvRate.ts`                         | `(raw) => { status: "empty" } \| { status: "valid", value } \| { status: "error", message }`. 규칙표는 AC-2(a)                                                                                                                                                                                                                                                              |
| 조건 요약        | `describeCondition(region, borrower, customLtvRate)`       | 사용자 지정이면 끝에 `" · 사용자 지정 LTV 70%"`를 붙인다                                                                                                                                                                                                                                                                                                                    |
| 한국어 금액 파싱 | `src/lib/utils/parseKoreanPrice.ts`                        | `(text) => number \| null`(만원). 규칙표는 AC-7(a)                                                                                                                                                                                                                                                                                                                          |
| 공유 텍스트 파싱 | `src/lib/utils/parseListingShareText.ts`                   | `(text) => ShareTextParseResult`(아래)                                                                                                                                                                                                                                                                                                                                      |
| 이름 제안 선택   | `…/Calculator/pickSuggestedName.ts`                        | `(existingName, listingId, suggested) => string`. 불러온 매물을 편집 중이면 기존 이름, 아니면 제안. 순수 함수다                                                                                                                                                                                                                                                             |
| 붙여넣기 적용    | `…/Calculator/applyShareText.ts`                           | `(draft, parsed) => Draft`. `salePrice`를 채우고 `kbPrice`를 비우고 `listingId`를 `null`로 만든다. 순수 함수다(ADR-018: 화면 규칙 로직은 순수 함수로 먼저 뺀다)                                                                                                                                                                                                             |

파싱 필드 규칙(`parseTradesResponse`):

- **필수 필드**: `aptNm`, `excluUseAr`, `dealAmount`, `dealYear`, `dealMonth`, `dealDay`. 하나라도 없거나 숫자로 못 바꾸면 `ok: false`(→ 502). 선택 필드(`umdNm`, `floor`)가 비어 있으면 `null`이다. 해제 표시 필드가 없는 행은 해제가 아닌 거래다.
- 값은 파싱 전에 `trim()`한다. 쉼표 제거는 그 뒤다. 날짜 한 자리는 0을 채운다(`"8"` → `"2025-01-08"`). `&amp;` 같은 엔티티는 풀어 읽는다.
- 0건(`items` 빈 값)은 정상이다(`items: []`). 1건(객체)과 다건(배열)을 같은 모양으로 돌려준다. "0건"과 "필드 누락"을 구분한다.

```ts
type ShareTextParseResult =
  | {
      ok: true;
      salePrice: number; // 만원
      complexName: string | null; // 최선 추정. 틀릴 수 있다
      areaText: string | null; // 원문 표기 그대로(예 "84㎡", "34평"). 평→㎡ 환산하지 않음
      suggestedName: string; // complexName + areaText, LISTING_NAME_MAX_LENGTH(코드포인트)로 자름. 둘 다 없으면 ""
    }
  | { ok: false; reason: "empty" | "notSale" | "priceNotFound" };
```

- 매매가는 `매매` 단어 뒤 첫 금액이다. `전세`·`월세`만 있고 `매매`가 없으면 `notSale`이다. `매매`는 있는데 금액이 없으면(`매매 협의`) `priceNotFound`다. `전세 7억 매매 12억 5,000`은 125000이다.
- 실제 공유 텍스트 형식은 확인하지 못했다(가정 A10). 그래서 파서는 줄 순서에 기대지 않고 키워드(`매매`, `㎡`, `평`, `전용`)와 금액 패턴으로만 찾는다.
- `complexName`은 **최선 추정**이다. 규칙은 "URL이 아니고 `매매`·금액·면적·층 토큰이 없는 첫 줄"로 시작하고, 못 찾으면 `null`이다. 실제 샘플(U3)이 오면 규칙을 바꿀 수 있어서, `complexName` 단언은 `assumed-` fixture에만 둔다. `url`과 `exclusiveArea`는 쓰는 화면이 없어 반환하지 않는다.
- 미리보기에서 사용자는 틀린 단지명을 실거래가 시트의 단지명 칸에서 지울 수 있다. 빈 결과 문구가 그 사실을 안내한다.

## 화면

모바일 360px 한 컬럼을 유지한다. 라우트는 `#/`, `#/listings` 두 개 그대로다(ADR-004 유지, ADR-017). 시트는 히스토리에 넣지 않는다(저장 시트와 같다). 실거래가 시트에서 결과를 읽다가 뒤로 가기를 누르면 이전 페이지로 나갈 수 있다는 위험을 알고 간다. 반복해서 불편하면 그때 시트용 히스토리 항목을 넣는다(ADR-017 뒤집을 조건).

1. **계산 화면 — 보유 상태**
   - 라디오 5개(2열 그리드, 마지막 줄 1개). 라벨 "무주택·서민실수요자"는 11자라 칩 너비(360px 기준 안쪽 약 144px)에 빠듯하므로 360px에서 줄바꿈이 어색하지 않은지 점검한다. "무주택·서민실수요자"를 고르면 라디오 아래에 요건 3줄과 "생애최초에도 해당하면 '무주택·생애최초'가 LTV가 더 높습니다"를 보여 준다. 문구 수치는 `PREFERRED_BORROWER_REQUIREMENTS`에서 만든다.
   - 결과 카드 조건 요약 근처에 "소득·무주택세대주 요건은 확인하지 않았습니다"를 한 줄 보여 준다(`noHomePreferred`일 때. 안내는 라디오를 고른 순간에만 보이고 선택은 draft에 남기 때문이다).
   - `ineligible` 결과: LTV 줄에 "요건 미충족" 배지를 단다. 한도와 자기자금은 "—"이고, "주택가격 8억 5,000만원(매매가)이 8억원을 넘어 서민·실수요자 우대 대상이 아닙니다. 보유 상태를 '무주택'으로 바꿔 계산하세요"를 보여 준다. 판정 가격과 출처(매매가/KB시세)를 함께 적는다.
   - **고정 요약 바**: `ineligible`이면 "—" 아래에 "요건 미충족" 한 줄 태그를 단다. 사용자 지정 LTV이면 "사용자 지정 LTV 70%" 태그를 단다. 스크롤 없이 현재 상태를 읽을 수 있는 유일한 곳이다(입력부가 길어져 결과 카드가 첫 화면 아래로 밀리기 때문).
   - 비수도권 + 서민·실수요자 조합이 `unconfirmed`(셀 `null`)면 1차 미확인 문구를 쓴다. 이 문구가 서민·실수요자에도 맞는 문장인지 확인한다.
2. **계산 화면 — LTV 직접 입력**
   - 보유 상태 아래에 스위치 "LTV 직접 입력(은행 상담값)"을 둔다. 켜면 `%` 접미사가 붙은 입력 칸이 나온다(`inputMode="numeric"`, 금액 칸과 같이 blur 시 필드 아래 오류).
   - 켜져 있는데 값이 비었거나 오류이면 결과 카드는 빈 상태("LTV를 입력하거나 직접 입력을 끄세요")가 되고 저장 버튼은 비활성이다. 켠 채 비었을 때는 **입력 칸 아래에 즉시** 같은 안내를 보여 준다(결과 카드가 화면 밖일 수 있어 저장이 왜 안 되는지 알리기 위해서).
   - 결과 카드 LTV 줄: "사용자 지정 LTV 70%" + 보조 문구. 규제 기준 병기는 `regulation`에 따라 다르다. `ok`면 "규제 기준 40%", `ineligible`이면 "규제 기준: 서민·실수요자 요건 미충족", `unconfirmed`면 "규제 기준 미확인". 상한이 있는 지역(`cap !== null`)에서만 "한도 상한은 규제대로 적용"을 덧붙인다(비수도권은 상한이 없어 쓰지 않는다). `source: "regulation"`이면 "규제 기준" 줄은 없다.
   - 사용자 값이 규제 값보다 **엄격히 크면**(`custom > regulation.rate`, `regulation.status === "ok"`일 때만) "규제 LTV보다 높습니다. 은행 상담 조건(생애최초·정책대출 등)을 확인하세요"를 한 줄 더한다. 같거나 비교할 수 없으면 경고가 없다.
   - 기준일·근거 보기는 그대로 둔다. 사용자 지정일 때는 근거 목록 맨 위에 "LTV: 사용자 입력(규제 근거 아님)"을 넣는다.
   - 한도가 0이면 "0원"으로 보여 준다(`—`로 바꾸지 않는다. `—`는 `null`일 때만).
3. **저장 목록**
   - 카드 조건 요약에 "사용자 지정 LTV 70%"를 붙이고 배지 "사용자 지정"을 단다. `ineligible` 카드는 "계산 불가 · 요건 미충족" 배지를 단다.
4. **붙여넣기 시트** (입력 섹션 맨 위의 "붙여넣기로 채우기" 보조 버튼. 헤더에는 두지 않는다. 360px에서 제목과 "새 계산" 버튼이 이미 한 줄이다)
   - textarea 하나. 클립보드 API는 쓰지 않고 사용자가 직접 붙여 넣는다(iOS 권한 팝업을 피하고 jsdom에서 테스트하기 쉽다). **"읽기" 버튼은 없다.** 값이 바뀌면 곧바로 미리보기를 갱신한다(외부 요청이 아닌 순수 함수라 입력 시점 규칙과 충돌하지 않는다).
   - 성공: 미리보기 "매매가 12억 5,000만원 · 단지 래미안OO · 면적 84㎡"를 보여 주고, 현재 매매가 칸에 값이 있으면 "현재 10억원 → 12억 5,000만원"을 함께 보여 준다. 적용이 하는 일도 미리보기에 적는다: "KB시세는 비워집니다", 단지명을 읽었으면 "실거래가 단지명 칸에도 채웁니다".
   - "적용"을 누르면 새 매물 계산으로 본다: `draft.salePrice`를 채우고 `draft.kbPrice`를 비우고 `draft.listingId`를 해제한다(편집 중이던 매물을 덮어쓰지 않기 위해서). 이름 제안(`suggestedName`)과 단지명 힌트는 계산 화면 컴포넌트 상태에 둔다(새로고침하면 사라진다). 이름 제안·단지명 힌트는 저장 성공, 새 계산, 매물 열기에서 비운다. 시트를 닫고 KB시세 칸으로 포커스가 간다. 저장 시트의 이름 칸은 `pickSuggestedName`으로 정한다.
   - 실패: 붙여 넣은 텍스트를 지우지 않는다. 시트 안에 이유별 문구를 보여 준다. `notSale`은 "매매 매물이 아닌 것 같습니다(전세·월세)", `priceNotFound`는 "매매가를 찾지 못했습니다. 금액을 직접 입력하세요"다. `empty`는 오류가 아니라 "텍스트를 붙여 넣으세요" 안내이고 "적용"은 비활성이다. 입력값은 바꾸지 않는다.
5. **실거래가 시트** (결과 카드 아래 "이 지역 실거래가 보기" 버튼)
   - 시도 select → 시군구 select(시도에 딸린 것만, 시도를 바꾸면 시군구는 "선택" 초기값) → 단지명 입력(선택) → "조회". 네이티브 `<select>`를 쓴다. 시군구를 고르면 즉시 조회 기억(`loan-calculator/trade-lookup`)에 저장한다. 시트를 열 때 기억된 시군구가 있으면 바로 조회한다.
   - 조회 파라미터는 시트의 **제출된 파라미터 상태**다. 단지명을 타이핑하는 동안은 요청이 나가지 않고 "조회"(또는 시군구 선택)를 눌렀을 때 나간다.
   - 결과: "최근 3개월 · N건 · 국토교통부 실거래가(계약일 기준, 신고 기한 30일이라 이번 달은 일부만 있음)"을 쓰고, 행은 2줄이다. 윗줄은 단지명(왼쪽)과 거래금액(오른쪽, 굵게), 아랫줄은 계약일 · 전용면적 · 층 · 법정동이다(`formatTradeRow`). "참고용이며 계산에 반영하지 않습니다"를 단다.
   - 시트 높이는 뷰포트의 90% 안으로 제한하고 결과 영역만 스크롤한다. 제목 줄에 닫기 버튼을 둔다.
   - 상태 렌더링(로딩 스켈레톤 3줄, 빈 상태, 오류, 행, 더 보기)은 `{ status, data, error }`를 prop으로 받는 표시 컴포넌트가 맡는다. 빈 상태 문구는 "이 조건의 거래가 없습니다. 단지명을 지우거나 다른 시군구를 고르세요"다. 오류 문구는 `describeTradesError`가 정한다. `notConfigured`는 "서버 설정이 끝나지 않았습니다(서비스키 미등록)", `quotaExceeded`는 "오늘 조회 한도를 넘었습니다. 내일 다시 시도하세요", `rateLimited`는 "잠시 뒤 다시 시도하세요", 그 밖은 "실거래가를 불러오지 못했습니다"이고 "다시 시도" 버튼을 둔다. 오류는 시트 안 결과 자리에 둔다.
   - 결과 50건이 넘으면 처음 50건을 보여 주고 "더 보기"를 둔다(클라이언트 측 자르기).
6. **시트 공통**: 저장·붙여넣기·실거래가 시트는 하나의 `Sheet` 프레임(backdrop, Esc, 포커스 복귀, 뒤 화면 `inert`)을 쓴다. 열린 시트는 `useState<"save" | "paste" | "trades" | null>` 하나로 관리해 동시에 열리는 상태를 막는다.

- **매일 쓰는 사람이 반복해서 겪을 불편**
  - 시군구를 매번 다시 고르지 않는다(조회 기억). 새로고침이나 저장 매물 열기·새 계산으로도 지워지지 않는다.
  - 붙여넣기가 기존 입력을 몰래 덮어쓰지 않는다(미리보기 → 적용). 적용 때 이전 매물의 KB시세가 새 매매가와 섞이지 않는다(비운다).
  - 사용자 지정 LTV를 켜 둔 것을 잊고 다른 매물을 계산하는 실수: "새 계산"이 끈다. 켜져 있는 동안은 요약 바와 결과 카드 조건 요약에 "사용자 지정 LTV 70%"가 항상 보인다.
  - 실거래가를 보다가 시트를 닫아도 입력값은 그대로다. 다시 열면 같은 조회 결과가 캐시에서 바로 뜬다(react-query `staleTime` 10분).
  - 오류 문구는 해당 필드 아래(LTV 입력)나 시트 안 결과 자리에 둔다.
  - 이전 매물의 단지명 필터가 다음 매물에 남아 빈 결과가 나오는 일이 없다(새 계산·매물 열기에서 비운다).

## 수용 기준

- [ ] AC-1: **서민·실수요자 LTV.**
  - (a) 규제 파일 무결성 테스트가 5 × 3 = 15칸을 순회하고, 테스트 파일에 직접 적은 기대값과 비교한다. 서민·실수요자 행은 규제지역 60, 수도권 비규제 70, 비수도권 `null`이다(1-2 원문 대조 결과 70으로 바뀌면 스펙과 이 테이블을 함께 고친다. 실제 상수 기대값은 이 한 곳에서만 고정하고, 화면 테스트의 미확인 케이스는 `regulations` prop fixture로 쓴다). 숫자 셀에는 1차 AC-5(b) 형식 검사를 그대로 적용한다. `PREFERRED_BORROWER_REQUIREMENTS`의 `sourceUrl`도 `REGULATION_SOURCES`에 있는 https URL이고, `effectiveDate`는 기준일 이하다.
  - (b) `calculateLoan` 예시. 모두 규제지역·서민실수요자다. 70000/70000 → ok, 60% 한도 42000, 자기자금 28000. 80000/79000 → ok(판정가 80000), 담보 79000, ltvAmount 47400. 80000/80000, 80001/80001의 `eligibilityPriceSource`는 `"equal"`이다. 80001/79000 → `ineligible`, `eligibilityPrice` 80001(`salePrice`), `cap`·`collateralBase`는 계산됨. 79000/80001 → `ineligible`(`kbPrice`). 같은 70000/70000을 수도권 비규제로 하면 ltvAmount 49000이고, 수도권 비규제 80001/80001은 `ineligible`이다(지역 무관). 규칙 순서: 비수도권·서민실수요자(셀 `null`)에서 90000/90000 → `ineligible`, 70000/70000 → `unconfirmed`. `ineligible`의 `cap` 구간은 `max(매매가, KB시세)` 기준이다.
  - (c) 화면(기존 통합 #3 확장): 이름과 단언을 라디오 5개와 순서로 고친다. "무주택·서민실수요자"를 고르면 요건 문구와 "소득·무주택세대주 요건은 확인하지 않았습니다"가 보인다. `ineligible`(85000/84000)이면 결과 카드에 "요건 미충족"이 있고, 한도 줄과 자기자금 줄이 정확히 `—`이며 판정 가격 출처(매매가)가 적혀 있다. 요약 바에도 "요건 미충족"이 있다(요약 바와 카드 둘 다 `—`이므로 `getByText("—")` 대신 영역별로 조회한다).
- [ ] AC-2: **사용자 지정 LTV 계산·입력.**
  - (a) `validateLtvRate` 규칙표(입력 → 결과). 앞뒤 공백을 지운 뒤 끝의 `%` 하나만 허용하고, `%`를 지운 뒤에는 다시 trim하지 않는다.

    | 입력                                                 | 결과                                                              |
    | ---------------------------------------------------- | ----------------------------------------------------------------- |
    | `""`, `"   "`                                        | empty                                                             |
    | `"0"`, `"100"`, `"70"`, `"70%"`, `" 70% "`, `" 0 "`  | valid (0, 100, 70, 70, 70, 0)                                     |
    | `"070"`, `"00"`                                      | valid (70, 0) — 금액 칸처럼 앞 0을 받는다                         |
    | `"70.5"`, `"70.0"`, `"70."`, `"100.5"`               | error "정수(%)로 입력하세요" (소수 메시지가 범위 메시지보다 먼저) |
    | `"101"`, `"1000"`, `"99999999999999999999"`          | error "0~100 사이로 입력하세요"                                   |
    | `"%"`, `" % "`, `"70 %"`, `"%70"`, `"70%%"`          | error "숫자만 입력하세요"                                         |
    | `"-5"`, `"-0"`, `"+70"`                              | error "숫자만 입력하세요"                                         |
    | `"7a"`, `"abc"`, `"1e2"`, `"0x10"`, `"1,0"`, `"7 0"` | error "숫자만 입력하세요"                                         |
    | `"７０"`(전각), `"٧٠"`                               | error "숫자만 입력하세요" (ASCII 숫자만)                          |

  - (b) `customLtvRate: 70`이면, 규제지역·무주택 100000/100000 → `appliedLtv: { source: "custom", rate: 70, regulation: { status: "ok", rate: 40 } }`, ltvAmount 70000, 상한 60000, 한도 60000이다(상한 유지). 200000/200000 → ltvAmount 140000, 상한 40000, 한도 40000. 상한 경계: 150000/150000에서 `customLtvRate: 100` → ltvAmount 150000, 상한 60000, 한도 60000이고, 150001/150001 → 상한 40000, 한도 40000. 상한이 안 걸리는 경우: `customLtvRate: 30`, 100000/100000 → ltvAmount 30000, 한도 30000. `customLtvRate: 100`, 100000/100000 → ltvAmount 100000, 한도 60000. 비수도권·무주택 99995/99995, 70 → 69996(내림, `cap`이 `null`이라 한도 = ltvAmount). 매매가 ≠ KB시세(100000/90000)에서도 담보 `min`(`collateralBase`, `collateralSource`)이 유지된다. `customLtvRate: 0` → 한도 0, 자기자금 매매가 전액.
  - (c) 규제 결과 병기: 규제 셀이 `null`인 fixture에서 `customLtvRate: 70`이면 `status: "ok"`, `regulation: { status: "unconfirmed" }`다. `ineligible` 조건(서민·실수요자, 90000/90000)에서 `customLtvRate: 60`이면 `ok`이고 `regulation: { status: "ineligible" }`다(사용자 지정이 우선). 지역·보유 상태를 바꾸면 `regulation`이 따라 바뀐다.
  - (d) 화면(통합 테스트 #6): 스위치를 켜고 70을 입력하면 결과 카드에 "사용자 지정 LTV 70%"와 "규제 기준 40%"가 보이고, 요약 바와 조건 요약에 "사용자 지정 LTV 70%"가 붙는다. 70 > 40이므로 "규제 LTV보다 높습니다" 경고가 있고, 규제와 같은 값(40)에서는 없다. 서민·실수요자 + 90000/90000 + 60이면 "규제 기준: 서민·실수요자 요건 미충족"이다. 규제 기준이 상한 없는 지역이면 "한도 상한은 규제대로 적용"이 없다. 스위치를 켠 채 비워 두면 입력 칸 아래에 "값을 입력하거나 직접 입력을 끄세요"가 즉시 보이고, 결과 카드는 빈 상태이며 저장 버튼은 `disabled`다. 껐다 다시 켜면 입력은 비어 있다. 0을 입력하면 한도 줄에 `0원`(`—` 아님)이 보인다.
- [ ] AC-3: **저장 형식과 1차 호환.**
  - (a) 1차 형식 그대로의 고정 JSON 문자열(`customLtvRate` 키 없음, borrower 4값 각각 한 항목)을 `loadListings`가 `ok`로 읽는다. 이 회귀 테스트는 테스트 파일에 문자열 리터럴로 둔다(제품 코드가 아니라 문자열에 기대므로 리팩터링으로 약해지지 않는다). **읽는 데서 멈추지 않고** 읽은 매물을 `calculateLoan`에 그대로 넘겨 `appliedLtv.source`가 `"regulation"`이고 `ownFunds`가 1차 코드로 계산한 기대값(리터럴 옆에 직접 적는다. 예: 규제지역·무주택 100000/100000 → 한도 40000, 자기자금 60000)과 같은지 확인한다. 같은 키 없는 매물 3개를 `sortListings`와 `ListingCard`에 넣어도 규제 LTV로 계산된다.
  - (b) `customLtvRate: 70`인 매물이 저장 → 새 스토어 로드 왕복 후에도 70이다. 규제 LTV로 저장한 매물의 JSON에는 `customLtvRate` 키가 없다. 사용자 지정이던 매물을 규제로 되돌려 편집 저장하면 키가 사라진다.
  - (c) `customLtvRate`가 `null`, `"70"`, `"0"`, `true`, `[]`, `{}`, `70.5`, `101`, `-1`이거나 borrower가 정해진 값이 아니면 목록 전체가 `corrupt`다. `0`, `100`, `100.0`(JSON에서 100), `noHomePreferred`는 유효하다.
  - (d) `sortListings`: `ineligible` 매물은 자기자금순 맨 뒤에 `unconfirmed`와 함께 놓이고(그 둘끼리는 `createdAt` 내림차순), 사용자 지정 매물은 자기 자기자금 위치에 놓인다. `ineligible`을 `unconfirmed` 앞에 두거나 일반 매물 앞에 두면 실패한다.
  - (e) 순수 함수 단위 테스트: 사용자 지정 LTV 매물을 열면(`listingToDraft`) `customLtv`가 채워지고 "저장됨"이며, LTV 값만 바꿔도(숫자 비교, `"70%"`로 고쳐 써도 같은 값이면 저장됨) "저장"이 다시 활성화된다. 규제 매물을 열면 `customLtv`는 `null`이다. "새 계산"은 금액·`listingId`를 비우고 `customLtv`를 `null`로 끈다(소재지·보유 상태는 유지). `ineligible` 입력도 저장 버튼이 활성이다. `parseDraft`는 `customLtv`가 없거나 타입이 틀린 draft를 기본값으로 바꾼다.
- [ ] AC-4: **서버 API 계약(실제 키·네트워크 없이).** `handleAptTrades`에 가짜 `fetch`, 고정 `now`, 가짜 캐시, fixture를 넣어 검증한다. 가짜 fetch는 호출 순서가 아니라 URL의 `DEAL_YMD`·`pageNo`로 응답을 고른다(달 조회가 병렬이다).
  - (a) `parseQuery`: `lawdCd` 누락·`""`·`"1111"`·`"111100"`·`"11110a"`·`" 11110"`·`LAWD_CODES`에 없는 `"99999"`·중복 키(`lawdCd=11110&lawdCd=11680`)는 400. `months`는 `"1"`·`"6"`만 통과하고 누락은 기본 3, `""`·`"0"`·`"7"`·`"2.5"`·`"03"`·`"+3"`·`"abc"`는 400. `aptName`은 앞뒤 공백 포함 40자 허용·41자 거부, 이모지 40개 허용·41개 거부(코드포인트), 공백만이면 필터 없음. 모두 400 `invalidParams`이고 `fetchImpl`이 호출되지 않으며 `message`에는 파라미터 이름만 있고 입력값이 없다. POST는 405 `methodNotAllowed`(`Allow: GET`, 본문 `ApiError`)다. 응답에 `Content-Type: application/json; charset=utf-8`·`nosniff`가 있고 CORS 헤더가 없다.
  - (b) 키가 없거나 공백·개행뿐이면 503 `notConfigured`이고 `fetchImpl` 미호출이다. 업스트림 20·30·31은 503 `notConfigured`다.
  - (c) 정상: 업스트림 요청 URL의 `LAWD_CD`·`DEAL_YMD`(KST 기준 최근 N달)가 맞고, `serviceKey`는 `new URL(url).searchParams.get("serviceKey")`가 원문 키와 같다(키는 `a+b/c=d`처럼 `+ / =`를 섞는다). 파싱: `"  115,000"` → 115000, 날짜 한 자리 `"8"` → `2025-01-08`, 해제 거래 제외(`cdealType` 값 변형 포함), `&amp;` 단지명, `floor`·`umdNm`이 빈 태그면 `null`, `"84.9700"` → 84.97. `aptName` 필터는 NFC·공백 무시(`래미안 OO` ↔ `래미안OO`)·대소문자 무시다(자모 분리 형태 입력도 일치). 정렬은 달 경계를 넘는 fixture에서 `dealDate` 내림차순, 같은 날 `dealAmount` 내림차순, 그래도 같으면 입력 순서다. 응답에 `totalCount`가 없다. 성공 응답에 `Cache-Control: public, max-age=600`이 있다.
  - (d) 파서 모양: 0건(`<items/>`·빈 `<items></items>` 또는 JSON 동등물)은 `items: []`로 200, 1건(객체)과 다건(배열)이 같은 결과 모양이다, 필수 필드(`aptNm`, `excluUseAr`, `dealAmount`, `dealYear`, `dealMonth`, `dealDay`) 중 하나라도 없거나 숫자가 아니면 502 `upstream`이다.
  - (e) 페이지 순회: 업스트림 `totalCount` 1000 → 1페이지, 1001 → 2페이지, 5000 → 5페이지(성공), 5001 → 502. `totalCount`는 큰데 items가 빈 페이지를 주는 fixture에서 5페이지 상한에서 끊긴다. 테스트는 XML 생성 헬퍼를 쓰거나 페이지 크기를 모듈 상수로 export해 줄여서 쓴다.
  - (f) 오류 매핑: 정상 형식 안의 `resultCode` 오류와 게이트웨이 형식(`OpenAPI_ServiceResponse`) 두 가지를 모두 fixture로 두고, HTTP 200과 비정상 상태 양쪽에서 같은 매핑을 따른다. 22 → 429 `quotaExceeded`, 23 → 429 `rateLimited`(`Retry-After: 2`), 20·30·31 → 503, 그 밖의 코드·빈 본문·HTML 본문·HTTP 4xx/5xx(오류 코드 없음)·fetch `TypeError` → 502, 타임아웃 → 504, 파서 예외 등 예상 밖 예외 → 500 `internal`(모두 `ApiError` 형태). 여러 달 중 하나라도 실패하면 전체 실패이고, 서로 다른 실패가 섞이면 429 > 504 > 502 순이다. 타임아웃 테스트는 실제로 기다리지 않는다: 가짜 fetch가 `new DOMException("", "TimeoutError")`로 reject하고, 핸들러가 넘긴 `init.signal`이 `AbortSignal`인지를 단언한다(가짜 타이머를 쓰지 않는다).
  - (g) 키 비노출: 응답 본문과 헤더에 원문 키와 `encodeURIComponent(key)` 두 형태가 모두 없다. 가짜 fetch가 URL(키 포함)을 메시지에 담은 `Error`로 reject해도 응답 `message`에 키가 없고, `console.log/warn/error` 스파이의 호출 인자 어디에도 키가 없다. 오류 `message`에는 업스트림 코드 외에 원문 응답이 없다.
  - (h) 캐시: 같은 `lawdCd`·달을 두 번 부르면 두 번째는 업스트림을 부르지 않는다. `aptName`이 달라도 같은 캐시를 쓴다(캐시 키에 `aptName`·서비스키가 없다). 실패는 저장하지 않는다. `cache`가 `null`이어도 동작한다.
  - (i) `recentMonths`: `2026-01-31T14:59:59.999Z`(KST 1/31 23:59) → `"202601"` 시작, `2026-01-31T15:00:00.000Z`(KST 2/1 00:00) → `"202602"` 시작, `2025-12-31T15:00:00Z`(KST 2026-01-01) → `"202601"`로 시작해 `count` 1과 6에서 연 경계를 넘는다.
  - fixture는 `server/aptTrades/__fixtures__/`에 원문 파일로 두고 `*.assumed.*`(2차 출처 기반 가정)와 `*.real.*`(2-3에서 받은 실제 응답, 키 없음)로 구분한다. real이 0개인 동안 AC-4는 "통과(가정 기준)"로만 보고하고 real 항목은 `it.todo`로 남긴다(파일이 없으면 조용히 통과하는 `skipIf`는 쓰지 않는다). real fixture가 통과해야 AC-4가 닫힌다.
- [ ] AC-5: **실거래가 시트.** (통합 테스트 #7. `fetch`를 가짜로 바꾸고, 렌더 헬퍼가 테스트마다 새 `QueryClient`(`retry: false`)와 `QueryClientProvider`를 만든다.)
  - (a) 시도를 고르면 시군구 목록이 그 시도 것만 나오고, 시도를 바꾸면 시군구가 초기값으로 돌아간다. 시군구를 고르면 요청 URL이 `lawdCd`·`months=3`을 담고 단지명이 비면 `aptName` 파라미터가 없다. 단지명을 타이핑하는 동안은 요청이 나가지 않는다. 조회하면 로딩 표시 뒤에 행이 `formatManwon` 금액으로 나온다.
  - (b) 시트를 닫았다 열면 같은 시군구가 선택돼 있고 즉시 1회 조회하며(기억이 있을 때), 한 번 더 닫았다 열면 재조회 없이 캐시에서 뜬다(fetch 호출 수 단언). 페이지를 새로고침한 뒤에도, 저장 매물을 열고 돌아와도, "새 계산" 뒤에도 시군구 기억이 유지된다. 단지명 필터는 새 계산·매물 열기에서 비워진다.
  - (c) 표시 컴포넌트(prop 테스트): 빈 결과는 빈 상태 문구, 429(`quotaExceeded`·`rateLimited`)는 각 문구, 500 등은 "다시 시도" 버튼(눌러서 재조회)을 보여 준다. `describeTradesError`는 `ApiError.error` 전부와 HTML 본문·네트워크 실패를 단위 테스트로 닫는다. 더 보기 경계는 50건(버튼 없음), 51건(있음), 100건·101건이다. `formatTradeRow`는 정수 면적(`59` → `59㎡`), 층 `null`을 경계로 확인한다.
  - (d) `LAWD_CODES` 테스트: 코드는 모두 `^\d{5}$`이고 중복이 없으며, 모든 항목의 `sido`·`sigungu`가 비어 있지 않고, 한 시도 안에 같은 `sigungu` 이름이 없고, 200개 이상이며, `11110`(서울특별시 종로구)을 포함한다. 개편 전 구 코드(`42xxx` 강원, `45xxx` 전북)가 없다. 수원 `41111` 포함·`41110` 부재 단언은 2-3 결과(A7) 뒤에 고정한다.
- [ ] AC-6: **시크릿·로컬·CI.**
  - (a) `.gitignore`는 `.dev.vars`, `.dev.vars.*`, `!.dev.vars.example`, `.wrangler/`를 가진다. `git check-ignore .dev.vars`는 성공하고 `.dev.vars.example`은 무시되지 않는다. `.dev.vars.example`은 `MOLIT_SERVICE_KEY=`처럼 값이 비어 있거나 자리표시자다(CI 쉘 한 줄이나 vitest). 저장소 어디에도 실제 키가 없다(리뷰 체크).
  - (b) CI 스텝으로 `pnpm build` 직후 `! grep -rE "MOLIT_SERVICE_KEY|apis\.data\.go\.kr" dist`가 통과한다(클라이언트 번들에 서버 코드가 섞이지 않음. `dist/`가 없으면 실패한다). 클라이언트가 서버 모듈을 일반 import하면 실패해야 한다(변이).
  - (c) CI의 `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`가 `functions/`와 `server/`를 포함해 통과한다(`tsc -b`가 functions tsconfig를 참조). `server/` 파일에 일부러 타입 오류를 넣으면 `pnpm build`가 실패한다(변이). ESLint는 `.wrangler/**`를 무시하고 `server/`·`functions/`는 검사한다. vitest가 `server/**/*.test.ts`를 줍는다. `pnpm install --frozen-lockfile`이 `workerd`·`esbuild` 설치 스크립트(`pnpm.onlyBuiltDependencies`) 때문에 막히지 않는다.
  - (d) CI의 dev 서버 연기 테스트: `pnpm build` 후 `wrangler pages dev`를 백그라운드로 띄우고(`WRANGLER_SEND_METRICS=false`, 시작 대기 `curl --retry-connrefused --retry 20`) `curl`로 `/api/apt-trades` → 400 `invalidParams`, `/api/apt-trades?lawdCd=11680` → 503 `notConfigured`(CI에 키 없음), `POST` → 405를 확인한다. 실제 키·네트워크는 쓰지 않는다. 연기 테스트가 같은 번들을 쓰므로 CI에서 `build:functions`는 생략한다(로컬 스크립트로는 둔다).
  - (e) 로컬 실행 절차대로 `wrangler pages dev`에서 `/api/apt-trades`가 응답한다(수동, 키가 없으면 503 확인까지).
- [ ] AC-7: **붙여넣기 파서와 적용.**
  - (a) `parseKoreanPrice`: 아래 표대로 동작하고, 왕복(`parseKoreanPrice(formatManwon(N)) === N`, N = 1, 9999, 10000, 12500, 98000, 120000, `MAX_AMOUNT` 인접)이 성립한다.

    | 입력                                                                           | 결과   |
    | ------------------------------------------------------------------------------ | ------ |
    | `"12억 5,000"`, `"12억5000만원"`, `"12억 5천"`, `"125,000만원"`                | 125000 |
    | `"12억"`                                                                       | 120000 |
    | `"9억 8천"`                                                                    | 98000  |
    | `"8,500"`                                                                      | 8500   |
    | `"12"`, `"85"`, `"5000"`(단위·쉼표 없는 맨 숫자), `"0"`, `"0억"`, `"억"`, `""` | null   |
    | `"12.5억"`, `"1조"`, `"125,000원"`, 전각 숫자                                  | null   |
    | 결과가 `MAX_AMOUNT`를 넘는 값(`"999억"`)                                       | null   |

    NBSP·제로폭 공백은 일반 공백으로 읽는다(iOS 붙여넣기에 흔하다). 표의 수치가 구현에서 다르게 정해지면 표를 함께 고친다. `매매 25층 …`의 25가 금액이 되면 안 된다.

  - (b) `parseListingShareText`: fixture 쌍을 `src/lib/utils/__fixtures__/shareText/`에 `NN-name.txt`(원문 그대로, NBSP·제로폭 포함)와 `NN-name.expected.json`으로 두고 `it.each`로 돈다. 가정 샘플 3개(매매 정상, 전세만, 금액 없음)는 `assumed-` 접두를 달고, U3로 받은 실제 샘플은 접두 없이 추가한다. 실제 샘플 추가는 파일 2개 추가이고, 실패하면 파서를 고친다(기대값을 느슨히 바꾸지 않는다). 개인정보(전화번호)는 같은 자릿수의 가짜로 바꾼다. 실제 샘플이 0개인 동안 AC-7(a)(b)는 "통과(가정 기준)", T5는 "미검증"으로 보고한다. `complexName`은 `assumed-` fixture에서만 단언하고, 실제 fixture는 `salePrice`와 성공/실패 이유만 단언한다.
  - (c) 특성 테스트: 같은 줄들의 순열에서 `salePrice`가 같다(줄 순서 불변). 방해 숫자(`25/35층`, 입주연도, 동·호수, 전화번호 모양, 공급/전용 쌍 `112/84㎡`)가 매매가로 읽히지 않는다. `전세 7억 매매 12억 5,000` → 125000, `월세 1억/200` → `notSale`, `매매 협의` → `priceNotFound`, 빈 문자열 → `empty`. 입력 변형(CRLF, 빈 줄, 탭, NBSP, URL이 앞·중간·뒤, `㎡`/`m²`/`평`, 이모지, 10만 자 텍스트가 1초 안)을 통과한다. `평`만 있으면 `areaText: "34평"`이고 이름에 `34평`이 붙는다. `suggestedName`은 `LISTING_NAME_MAX_LENGTH`(코드포인트)로 자르고 `validateListingName`을 통과한다(이모지가 경계에 걸려도).
  - (d) 순수 함수: `applyShareText`는 `salePrice`를 채우고 `kbPrice`를 `""`로, `listingId`를 `null`로 만든다. `pickSuggestedName`은 편집 중(`listingId` 있음)이면 기존 이름, 아니면 제안을 돌려준다.
  - (e) 통합 테스트 #8: 시트에 매매 샘플을 붙이면 "읽기" 없이 미리보기에 매매가·단지명이 보인다. 미리보기에 "KB시세는 비워집니다"가 있다. "적용" 전에는 `draft.salePrice`가 바뀌지 않고, 적용 후 매매가 칸이 채워지고 KB시세 칸은 비며 편집 중이던 매물 연결이 풀린다. 저장 시트 이름 칸에 제안 이름이 들어가고, 저장 성공·새 계산·매물 열기 뒤에는 제안이 사라진다. 전세 샘플은 `notSale` 문구가 보이고 입력값과 textarea 내용이 그대로다.
- [ ] AC-8: **실환경 수동 확인.** (사용자 키 등록 후, Pages 미리보기 URL과 휴대폰에서 확인한다.) T1 미리보기 배포에서 `/api/apt-trades?lawdCd=11680`이 200과 거래 목록을 돌려준다(Cloudflare 데이터센터 IP에서 업스트림이 받아들여진다는 뜻이며, 2-3에서 먼저 한 번 확인한 결과를 여기서 다시 확인한다). T2 브라우저 DevTools 네트워크 탭에서 응답과 요청(소스맵 포함) 어디에도 서비스키가 보이지 않는다. T3 2-3에서 받은 실제 응답 fixture(키가 없는 것을 확인함)로 AC-4 테스트가 통과한다. T4 1차에서 남은 M2·M3·M5를 같은 미리보기 URL에서 확인한다. T5 U3 실제 공유 텍스트로 붙여넣기 → 적용이 동작한다. 추가로 휴대폰 360px에서 라디오 5개 2열(마지막 줄 1개)과 요건 안내 3줄, 키보드가 올라온 상태의 LTV 입력 오류 위치, iOS 붙여넣기의 NBSP·제로폭 문자, 시트 높이와 행 2줄을 확인한다.

### 통합 테스트 매핑 (ADR-018)

통합 테스트는 시나리오 8개, 시나리오당 `it` 1개다. 상태 렌더링은 prop 기반 표시 컴포넌트, 오류 문구·붙여넣기 적용·이름 제안은 순수 함수로 빼서 단위 테스트한다.

| #   | 내용                                                                                   | AC   |
| --- | -------------------------------------------------------------------------------------- | ---- |
| 3   | (기존) 라디오 5개로 이름·개수 수정, 서민·실수요자 요건 문구, `ineligible` 표시         | AC-1 |
| 6   | LTV 직접 입력 → "사용자 지정 LTV 70%"·"규제 기준 40%", 빈 값이면 저장 비활성·즉시 안내 | AC-2 |
| 7   | 실거래가 시트: 시군구 선택 → 요청 URL → 행 표시, 선택 기억·캐시 재사용                 | AC-5 |
| 8   | 붙여넣기 → 미리보기 → 적용(KB시세 비움), 전세 샘플은 실패 문구                         | AC-7 |

## 태스크

- [ ] 1. **LTV 옵션 엔드투엔드**(서민·실수요자 + 사용자 지정 LTV, 저장까지) — AC-1, AC-2, AC-3
  - [ ] 1-1. 계약 선행: `Borrower` 5값, `PreferredBorrowerRequirements`, `Regulations.preferredBorrower`, `LoanInput`/`Listing`의 `customLtvRate?`, `RegulationOutcome`·`AppliedLtv`, `LoanResultBase` 재정의, `LoanResult`의 `ineligible`, `ltv` → `appliedLtv` 이름 변경과 파급(`ResultCard`, `RegulationBasis`, `LtvValue`, `calculateLoan.test`, `ResultCard.test`), `Record<LoanResult["status"], …>` 레지스트리 골격, `Draft.customLtv`, `validateLtvRate` 스텁, `describeCondition` 새 시그니처, `BORROWERS`·`BORROWER_LABELS` 순서 갱신 (담당: client)
  - [ ] 1-2. 규제 파일: 서민·실수요자 행 3칸, `PREFERRED_BORROWER_REQUIREMENTS`, `REGULATION_BASE_DATE = "2026-10-22"`. 커밋 전에 S3 첨부 PDF를 사람이 열어 60%·각주 5)·비교 열 제목을 대조한다(U4). 비교 열이 "비규제지역 일반"이면 비수도권 셀을 70%로 바꾸고 스펙 AC-1(a)도 고친다. 확인하지 못하면 `null`로 둔다 (담당: client)
  - [ ] 1-3. 로직: `evaluateRegulation`·`calculateLoan` 우선순위 규칙(`typeof` 판정), `validateLtvRate` 구현, `toLoanInput`(유효할 때만 키), `listingStorage` 검증(선택 필드 typeof → 정수 → 0~100, 5값), 규제로 되돌려 저장하면 키 제거, `sortListings`(`ineligible` 뒤로), `saveButtonState` 비교(`?? null`, 정규화한 숫자), `parseDraft`·`listingToDraft`(`customLtv`), "새 계산" 시 `customLtv` 해제 (담당: client)
  - [ ] 1-4a. 화면 1: 입력부를 `LoanInputs`(금액·소재지·보유 상태)로 분리해 `MortgageCalculator`에는 구조만 남긴다. 라디오 5개 + 요건 안내 + 결과 카드의 "요건 확인 안 함" 문구, `ineligible` 결과(배지·"—"·판정 가격 출처), 고정 요약 바 "요건 미충족" 태그, 목록 카드 "계산 불가 · 요건 미충족" 배지, 레지스트리 연결, 360px 점검(라벨 "무주택·서민실수요자" 줄바꿈 포함) (담당: client)
  - [ ] 1-4b. 화면 2: `CustomLtvField`(스위치·`%` 입력·blur 오류·켠 채 비었을 때 즉시 안내, `AmountInput`과 같은 패턴), 결과 카드 LTV 줄(사용자 지정, 규제 기준 병기 3종, 초과 경고, 상한 문구 조건), 요약 바 "사용자 지정 LTV n%" 태그, 근거 목록 맨 위 사용자 입력 표시, 목록 카드 "사용자 지정" 배지, `LtvValue` source별 레지스트리 (담당: client)
  - [ ] 1-5. 테스트: AC-1(a)(b), AC-2(a)(b)(c), AC-3 전부, 기존 #3 수정, 통합 #6. 변이 확인(아래 목록의 1차 항목) (담당: test)
- [ ] 2. **실거래가 조회**(첫 서버 코드) — AC-4, AC-5, AC-6, AC-8 T1~T3
  - [ ] 2-1. 서버 골격: devDependency `wrangler`와 `@cloudflare/workers-types`, `wrangler.jsonc`(`name`, `compatibility_date`, `pages_build_output_dir: "dist"`. 대시보드의 시크릿 등록이 막히지 않는지 확인), 손으로 쓴 `Env`(`MOLIT_SERVICE_KEY?: string`), `tsconfig.functions.json`(functions·server, workers 타입, `lib`에 DOM 제외, 테스트 파일용 vitest 타입은 별도 `include`/`types`), 루트 tsconfig 참조 추가, `server/`·`functions/`는 상대 경로 import만, `.dev.vars.example`, `.gitignore`(`.dev.vars`, `.dev.vars.*`, `!.dev.vars.example`, `.wrangler/`), ESLint `ignores`에 `.wrangler/**`, `pnpm.onlyBuiltDependencies`(`workerd`·`esbuild`)와 `--frozen-lockfile` 확인, wrangler Node 요구 버전 확인, Vite `server.proxy`로 `/api` → `http://localhost:8788`, 스크립트 `dev:api`(`pnpm build && wrangler pages dev`. 한 번 빌드되면 매번 재빌드하지 않아도 된다는 점을 README에 적는다)와 `build:functions`, CI에 dev 서버 연기 테스트 스텝과 `dist/` 키 문자열 grep 스텝을 추가한다 (담당: backend)
  - [ ] 2-2. `server/aptTrades/*`: `parseQuery`, `recentMonths`, `buildUpstreamUrl`, `parseTradesResponse`(형식 중립), `monthCache`, `handleAptTrades`(페이지 순회, 병렬 달 조회, 공유 타임아웃, 부분 실패 규칙, 오류 매핑, 키 비노출, try/catch 한 겹), `functions/api/apt-trades.ts` 진입점. fixture는 2차 출처 구조로 `*.assumed.*`를 먼저 만든다 (담당: backend)
  - [ ] 2-3. 실제 응답 확인(U1 키 도착 시 **2-1 직후**로 당긴다. 키가 아직 없으면 건너뛰고 2-2, 2-4, 2-5를 먼저 진행한 뒤 키가 오면 끼워 넣는다):
    - (a) **Cloudflare IP 경로 먼저**: 키를 응답에 담지 않는 일회용 핸들러(또는 2-2 핸들러)를 Pages 미리보기에 배포해 업스트림 호출 1회(성공 또는 오류 코드)를 확인한다(A13). 막히면 거기서 멈추고 ADR-011을 다시 연다
    - (b) 로컬 `.dev.vars`로 강남구(11680)·종로구(11110)·수원시(41110과 41111 비교)·화성시 시 코드(41590)와 동탄구 코드·최근 개편된 지역을 1회씩 호출해 응답 구조, 해제 표시 값, `numOfRows` 상한과 실제 반환 건수, `_type=json` 지원, 1건 응답의 `item` 형태, 오류 응답 형식(일부러 틀린 키), 승인 직후 키의 활성화 지연을 확인한다
    - (c) `pages.dev`에서 Cache API가 동작하는지 확인한다(동작하지 않으면 A12대로 캐시 없이 간다)
    - (d) 실제 응답 크기로 파싱 시간(CPU 한도 10ms)을 추정하고, JSON/`fast-xml-parser`를 확정하며(ADR-015), 유료 플랜이 필요하면 사용자에게 알린다
    - (e) 실제 응답을 키 없이 `*.real.*` fixture로 저장하고 `it.todo`를 채운다. 결과를 스펙 "공식 문서로 확인하지 못한 것"과 A7·A8·A13에 반영한다 (담당: backend)
  - [ ] 2-4. 클라이언트:
    - (a) **첫 항목: `SaveSheet`에서 공통 `Sheet` 프레임을 추출**(backdrop·Esc·포커스 복귀·`inert`, `Calculator/components/`)하고 열린 시트 `useState<"save" | "paste" | "trades" | null>`로 묶는다. 저장 시트 회귀 테스트(통합 #2 등)를 그대로 통과시킨다
    - (b) `@tanstack/react-query` 도입, `lib/api/queryClient.ts`, `App.tsx`의 `QueryClientProvider`, 렌더 헬퍼에 `QueryClientProvider`(테스트마다 새 `QueryClient`, `retry: false`)를 넣어 기존 통합 테스트가 깨지지 않게 한다, `lib/api/client.ts`, `useAptTrades`(시트 컴포넌트 안에서만 호출)
    - (c) `lib/constants/lawdCodes.ts`와 생성 스크립트
    - (d) 조회 기억 저장(`loan-calculator/trade-lookup`), 실거래가 시트(시도·시군구 select, 단지명, 조회 버튼의 제출된 파라미터 상태), 표시 컴포넌트, `describeTradesError`, `formatTradeRow`, 시트 높이·행 2줄, 새 계산·매물 열기에서 단지명 필터 비우기 (담당: client)
  - [ ] 2-5. 테스트: AC-4 전부(서버 단위), AC-5 통합 #7과 표시 컴포넌트·순수 함수, `LAWD_CODES` 검사, AC-6(a)(b)(d). 변이 확인(아래 목록의 서버 항목) (담당: test)
  - [ ] 2-6. 실환경 확인 AC-8 T1~T3(Pages 연결과 시크릿 등록 후) (담당: test)
- [ ] 3. **붙여넣기 자동 채움** — AC-7, AC-8 T5
  - [ ] 3-1. `parseKoreanPrice`, `parseListingShareText`(키워드·패턴 기반, 줄 순서에 기대지 않음), `pickSuggestedName`, `applyShareText`. U3 실제 샘플이 오면 `__fixtures__/shareText/`에 파일 쌍만 추가하는 구조로 만든다 (담당: client)
  - [ ] 3-2. 붙여넣기 시트(입력 섹션 맨 위 버튼, 입력 즉시 미리보기, 적용 = 새 매물 계산, 실패 문구, textarea 유지), 저장 시트 이름 제안과 단지명 힌트의 수명, 적용 뒤 KB시세 칸 포커스. 공통 `Sheet` 프레임을 쓴다 (담당: client)
  - [ ] 3-3. 테스트: 규칙표, 왕복, 특성 테스트, 가정 fixture 3개, U3 실제 샘플, 통합 #8. 변이 확인: 전세 금액을 매매가로 읽기, 적용 전 덮어쓰기 (담당: test)

**변이 확인 목록**(구현 뒤 하나씩 켜서 테스트가 실패하는지 본다):

- 1차 계열: 판정 `>` → `>=`, 사용자 지정 우선순위 뒤집기, 상한 미적용, 선택 필드 존재 시 검증 생략(`null`·`"70"`이 통과), 선택 필드 누락을 `corrupt`로 처리, `customLtvRate` 판정 `typeof === "number"` → `!== null`(1차 매물이 사용자 지정으로 계산됨), 규제로 되돌려 저장할 때 이전 `customLtvRate`가 남음, `ineligible`을 `unconfirmed`/일반 매물 앞에 둠, 규칙 2·3 순서 뒤집기(비수도권 90000이 `unconfirmed`), 판정가를 `salePrice`로만 계산(KB시세 79000/80001), `loanLimit === 0`을 `—`로 표시, "새 계산"이 `customLtv`를 유지
- 서버 계열: 쉼표 미제거, 해제 거래 포함, KST → UTC, 키를 오류 메시지에 포함, 오류 메시지에 업스트림 원문 포함, 페이지 순회가 1페이지에서 멈춤, 5페이지 상한 제거, 3달 병렬을 순차로 바꾸고 호출 순서에 기대는 가정(URL 기반 테스트는 통과해야 정상), `server/`에서 타입 오류, 클라이언트가 서버 모듈을 일반 import
- 붙여넣기 계열: 전세 금액을 매매가로 읽기, 적용 전 덮어쓰기(읽기 단계에서 `draft.salePrice` 갱신), 적용 때 `kbPrice` 유지, 적용 때 `listingId` 유지

의존 관계:

- 1-1이 끝나면 1-2, 1-3, test의 1-5 작성이 병렬로 가능하다. 1-4a는 1-3 뒤, 1-4b는 1-4a 뒤다(`LoanInputs`·`ResultCard`를 함께 만진다).
- 2-1과 2-2(backend)는 1과 **병렬로** 시작할 수 있다. 계산 화면을 건드리지 않기 때문이다. **2-3은 U1(서비스키)이 오면 2-1 직후로 당긴다.** 키가 없으면 2-3을 건너뛰고 2-2, 2-4, 2-5를 가짜 응답으로 먼저 진행한다. 2-3 결과에 따라 2-2의 파서와 fixture를 고친다. 2-6은 Pages 연결과 시크릿 등록 이후다.
- 2-4는 1-4b 뒤다(`MortgageCalculator`·`LoanInputs`·draft 충돌 방지). 2-4(a) 공통 `Sheet` 프레임 추출이 먼저이고, API 계약은 이 스펙으로 확정돼 있으니 2-2와 병렬로 진행한다.
- 3-1은 언제든 병렬로 가능하다(순수 함수). 3-2는 2-4(a)(공통 프레임)와 조회 기억·단지명 힌트(2-4(d)) 뒤다. U3 샘플이 없으면 가정 fixture로 완료하고 AC-8 T5만 남긴다. 샘플이 오면 fixture 파일만 추가한다.

요구사항 → 태스크 매핑:

- 서민·실수요자 우대 LTV(1차 출처 수치, 출처·시행일, 미확인 처리) → 1 (1-2)
- 우대 요건(소득·주택가격·무주택세대주)과 한도 상한 관계 → 1 (요건 데이터, 판정, 상한 유지)
- 10·15 이후 유효성 확인 → 이 스펙 "규제 값" 절 + 1-2 원문 대조
- 사용자 지정 LTV, "사용자 지정 LTV" 표시, 규제 값과 구분 → 1 (1-3, 1-4b)
- 직접 지정 시 한도 상한 처리 → 1 (ADR-013, AC-2(b))
- 직접 지정 LTV의 저장 매물 반영(ADR-001 버전 없음 주의) → 1 (ADR-012, AC-3)
- 국토부 실거래가 API, 서버 보관 서비스키 → 2
- 법정동코드 선택 방법 → 2 (ADR-016, 2-4(c))
- 서버 형태(Pages Functions/Workers) → ADR-011, 2-1, 2-3(a)
- 로컬 개발·테스트(wrangler pages dev, .dev.vars), CI 검증 → 2-1, AC-6
- 네이버부동산 공유 텍스트 붙여넣기, 파싱 실패 처리 → 3
- 매물 링크 한 건 가져오기(조사·판단) → 이 스펙 "링크 가져오기 조사" + D9 + U2. 구현 태스크는 없다(U2 확인 대기, 그동안 제외)
- 시크릿 발급·등록 → U1

## 링크 가져오기 조사 (D9 근거)

요청은 "사용자가 붙여넣은 매물 링크 한 건만, 그때 서버에서 가져오기"였다. 세 사이트를 기술과 약관 두 축으로 확인했다.

| 사이트       | 기술적 가능성                                                                                                                                                                                                                                                                                                                                                                                      | 약관·법적                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 네이버부동산 | 이번 조사 도구로는 `new.land.naver.com`, `land.naver.com`, `policy.naver.com`에 접근할 수 없어 직접 확인하지 못했다(도구 정책상 차단이며, 사이트가 막은 것이라는 증거는 아니다). 매물 화면은 SPA이고 매물 데이터는 별도 내부 API에서 온다는 것이 일반적으로 알려져 있지만, 1차 확인은 아니다(가정 A11). 서버(Cloudflare 데이터센터 IP)에서 내부 API를 부르는 것은 공개된 계약이 없는 비공식 경로다 | 약관 원문은 확인하지 못했다. 보도에 따르면 네이버는 약관·정책상 크롤링을 허용하지 않는다([아주경제 2024-10-06](https://www.ajunews.com/view/20241006171154905)). **특허법원은 네이버를 부동산 매물 DB 제작자로 인정해 다윈프로퍼티에 DB 복제·전송 금지와 8천만원 배상을 명령했다**([한국경제 2026-01-04](https://www.hankyung.com/article/202601040488i)). 한 건씩이라도 반복 수집하면 같은 쟁점에 걸릴 수 있다 |
| 호갱노노     | `hogangnono.com/robots.txt`와 `/terms` 모두 **HTTP 403**이었다. 브라우저가 아닌 요청을 막는 것으로 보인다. 서버 fetch도 같은 차단을 받을 가능성이 높다                                                                                                                                                                                                                                             | 약관 원문은 403 때문에 확인하지 못했다                                                                                                                                                                                                                                                                                                                                                                          |
| KB부동산     | `kbland.kr/robots.txt`는 **`User-agent: *` → `Disallow: /`**이고 Googlebot·Yeti·일부 AI 봇만 허용한다. 우리 서버의 fetch는 `*`에 해당한다. 첫 화면 본문에 매물 데이터가 없다(클라이언트 렌더링으로 보임)                                                                                                                                                                                           | 약관 원문은 확인하지 못했다. robots.txt는 법적 구속력은 없지만 운영자의 의사 표시다                                                                                                                                                                                                                                                                                                                             |

결론: 세 곳 모두 공개 API가 없다. 각각 비공식 내부 API 의존(네이버), 봇 차단(호갱노노), robots 전면 금지(KB) 중 하나 이상에 걸린다. 약관을 확인하지 못한 곳도 있지만 판례와 robots 신호가 분명하다. 서버에서 가져오는 기능은 언제든 깨질 수 있고, 깨지면 고칠 공식 경로가 없다. 그래서 **범위에서 빼고 붙여넣기(태스크 3)로 대체하는 안을 추천한다**(D9-A). 사용자가 요청한 기능을 빼는 것이므로 U2로 확인을 받는다. 확인이 올 때까지는 범위 밖이다.

## 로컬 개발·테스트·CI

- **로컬 프론트만**: `pnpm dev`(Vite, 지금과 같다). `/api` 요청은 Vite proxy가 8788로 넘기므로, API가 필요 없는 화면 작업은 이것만으로 된다.
- **로컬 API 포함**: 터미널 1에서 `pnpm dev:api`(`pnpm build && wrangler pages dev`, 기본 `http://localhost:8788`)를 실행하고, 터미널 2에서 `pnpm dev`를 실행한다. `wrangler pages dev dist`는 `dist`가 한 번 있으면 되므로 매번 다시 빌드하지 않아도 된다(README에 적는다). 시크릿은 프로젝트 루트(`wrangler.jsonc`와 같은 디렉토리)의 `.dev.vars`에 `MOLIT_SERVICE_KEY=<Decoding 키>`로 둔다. `.env`와 동시에 쓰지 않는다(Cloudflare 문서). 키가 없으면 API가 503 `notConfigured`를 돌려주는 것이 정상이다.
- **테스트**: 서버 코드는 vitest 기본 node 환경에서 `handleAptTrades`에 가짜 fetch·가짜 캐시를 주입해 검증한다. `Request`/`Response`/`URL`/`AbortSignal.timeout`은 Node 런타임에도 있다. 실제 키나 네트워크를 쓰는 테스트는 CI에 두지 않는다. Workers 런타임 전용 테스트 도구(`@cloudflare/vitest-pool-workers`)는 이번에 도입하지 않는다(다음 단계 후보). 이 테스트는 Workers 런타임의 CPU 한도와 Node 전용 API 사용을 잡지 못한다. 앞쪽은 CI 연기 테스트와 AC-8 T1이, 뒤쪽은 2-3(d)의 추정이 메운다. XML 처리가 Node와 Workers에서 똑같이 돌아야 하므로 `DOMParser`(Workers에 없음)는 쓰지 않는다.
- **CI**: 기존 4단계(lint, format:check, test, build)에 `pnpm build` 직후 `dist/` 키 문자열 grep과 dev 서버 연기 테스트(AC-6(d))를 더한다. 시크릿은 CI에 두지 않는다. workerd 바이너리 다운로드가 CI 시간을 늘릴 수 있으므로 pnpm 캐시를 쓰고 시간을 측정한다.
- **배포**: Pages Git 연동(U3, 1차)에 `functions/` 디렉토리가 있으면 Functions가 함께 배포된다. 시크릿 `MOLIT_SERVICE_KEY`는 Production과 Preview 환경 모두에 Encrypt로 등록하고, 등록은 그것을 쓰는 배포보다 먼저 한다(U1). Production과 Preview가 같은 키를 쓰면 일일 한도를 공유한다(A12).

## 다음 단계 후보

- 매물 원본 링크 저장(서버 fetch 없이 URL만 저장, 목록에서 원문 열기, D9-C). `Listing`에 선택 필드 `sourceUrl?` 추가
- 매물에 전용면적 저장, 실거래가를 같은 면적대(±3㎡)로 거르기
- `/api/*` 호출 제한: 커스텀 도메인 연결 후 WAF Rate Limiting 규칙(IP당 분당 제한), 또는 Workers의 Rate Limiting 바인딩(B로 옮길 때), Cloudflare Access(부부 공유 저장과 함께)
- Preview 환경 접근 제한(Cloudflare Access): 저장소가 공개이거나 미리보기 URL이 PR에 남을 때 한도 소진을 막는다
- 실거래가 행을 눌러 "매매가로 쓰기"
- `ineligible` 결과 카드의 "무주택으로 계산" 버튼(보유 상태를 한 번에 바꾸기)
- 실거래가 시트용 히스토리 항목(뒤로 가기가 시트 닫기가 되게)
- 시군구 선택으로 규제지역 자동 판정(규제지역 명단을 규제 파일에 추가, 국토부 원문 필요)
- 비수도권 서민·실수요자 LTV 확정(원문 대조), 2주택 이상 다주택자 조건
- 사용자 지정 한도 상한(은행이 상한을 더 낮게 잡는 경우)
- `@cloudflare/vitest-pool-workers`로 Workers 런타임에서 서버 테스트
- gitleaks 사용자 규칙(64자 hex 서비스키 커밋 방지)
- 연립·다세대·오피스텔 실거래가(국토부 별도 API)
- 부부 공유 저장(D1 + Access), DSR, 부대비용 직접 입력(1차 후보 그대로)

## 가정

- A1: 서민·실수요자 우대는 무주택 차주의 한 경우로 보고 `borrower` 값 하나로 다룬다(ADR-009의 "라디오 하나" 유지). 생애최초와 겹치면 생애최초가 유리하므로 합산하지 않는다.
- A2: 소득과 무주택세대주 요건은 앱이 판정하지 않는다. 사용자가 안내 문구를 보고 스스로 고른다. 소득 입력은 DSR(범위 밖)과 함께 들어온다.
- A3: 서민·실수요자 "주택가격 8억원 이하"의 가격은 ADR-005와 같이 max(매매가, KB시세)로 판정하고, 쓴 가격을 표시한다. S3에 정의가 없기 때문이다.
- A4: 사용자 지정 LTV는 규제 LTV만 대체한다. 한도 상한, 담보 기준 min, 내림 규칙은 그대로다.
- A5: 사용자 지정 LTV가 있으면 서민·실수요자 요건 검사와 미확인 검사를 건너뛴다. 사용자가 은행에서 받은 숫자를 직접 넣었다는 뜻이기 때문이다. 대신 같은 조건의 규제 결과를 병기한다.
- A6: Draft에 `customLtv`가 늘어서 배포 직후 기존 draft는 한 번 기본값으로 초기화된다(1차 A11). 저장 목록은 영향이 없다.
- A7: 일반구가 있는 시(수원·성남·고양·용인·안산·안양·청주·천안·전주·포항·창원·화성 등)는 구 코드로 조회해야 한다고 본다. 시 코드(예: 41110)로 조회되는지는 2-3에서 확인하고, 되면 목록에 시 코드도 넣을지 다시 정한다. 2026-07 신설 구(동탄구 등)가 법정동코드 목록과 API의 `LAWD_CD`에 같은 시점에 반영됐는지도 2-3에서 확인한다.
- A8: `numOfRows=1000`이 허용된다고 본다(2-3에서 확인). 허용되지 않거나 업스트림이 조용히 더 작은 값으로 줄이면 상한 값으로 낮추고, 페이지 안전 상한(달당 5)을 다시 계산한다.
- A9: 서비스키는 포털의 Decoding 키(원문)를 시크릿에 넣는다. 서버가 Encoding 키를 자동 보정하지 않는다. 사용자 안내(U1)에도 그렇게 적는다.
- A10: 네이버부동산 공유 텍스트에는 매매가(예: "매매 12억 5,000"), 단지명, 면적이 들어 있다고 본다. 실제 형식은 확인하지 못했다. 그래서 파서를 키워드·패턴 기반으로 만들고, 실제 샘플(U3)로 보강한다. `complexName`은 최선 추정이다.
- A11: 네이버부동산 매물 화면이 SPA이고 데이터가 내부 API에서 온다는 것은 일반적으로 알려진 내용이지만, 이번에 1차로 확인하지 못했다. D9 판단은 이 가정보다 판례와 robots·403 근거에 기댄다.
- A12: `/api/apt-trades`는 인증 없이 공개되고 호출 제한이 없다. 완화책은 `lawdCd`를 `LAWD_CODES` 값으로 제한하는 것과 달 단위 Cache API 캐시다. 그래도 요청 한 번이 캐시 미스일 때 달마다 1회 이상(최대 6 × 5)을 쓰고, 시트를 열 때 기억된 시군구가 있으면 자동 조회한다(클라이언트 10분 캐시로 줄인다). Production과 Preview가 같은 키로 일일 한도(10,000)를 공유한다. 남이 호출해 한도를 쓸 위험은 개인 도구 규모라 받아들이고, 넘으면 429로 안내한다. `pages.dev`에서 Cache API가 동작하지 않으면(2-3에서 확인) 캐시 없이 `lawdCd` 검증만으로 간다. 호출 제한(WAF·Access)은 다음 단계다.
- A13: Cloudflare 데이터센터 IP에서 `apis.data.go.kr`가 호출된다고 본다. 해외 IP 차단 여부는 공식 자료로 확인하지 못했다. 로컬 실행은 한국 가정용 IP라 증명이 안 되므로 2-3(a)에서 Pages 미리보기로 일찍 확인한다. 막히면 "막힌 것"으로 보고하고 ADR-011을 다시 연다.
- A14: 세종처럼 시군구가 없는 시도는 `LAWD_CODES`의 `sigungu`에 시도 이름을 그대로 쓴다(select가 비지 않게 하려는 생성 스크립트 규칙).
- A15: 여러 달 부분 실패에서 429가 둘 섞이면(`quotaExceeded`와 `rateLimited`) 일일 한도인 `quotaExceeded`를 우선한다.
- A16: 시군구를 고르는 즉시 조회 기억에 저장한다(조회 클릭과 무관). 시트 높이 90%, 행 2줄, 붙여넣기 버튼의 입력 섹션 위치, 적용 뒤 KB시세 칸 포커스는 client-dev 검토의 제안을 그대로 받았다.

## 결정됨

팀 토론 결과(모두 채택). 상세와 이견은 각 ADR과 검토 원문에 있다.

- **D1 서버 형태** → [ADR-011](../decisions/011-server-pages-functions.md): Pages Functions. 얇은 진입점 + `server/aptTrades/*`, 달 단위 Cache API 캐시, `lawdCd`는 `LAWD_CODES` 값만, 오류 매핑(22 `quotaExceeded`·23 `rateLimited`, 20/30/31 → 503, 예외 → 500 `internal`), 요청 전체 공유 타임아웃, 2-1 직후 Cloudflare IP 경로 확인.
- **D2 서민·실수요자 요건(주택가격) 초과 처리, D4 사용자 지정 시 한도 상한** → [ADR-013](../decisions/013-ltv-option-rules.md): `ineligible` 상태로 계산하지 않고 이유를 표시한다. 우선순위는 사용자 지정 > `ineligible` > `unconfirmed` > 규제 LTV이고, 사용자 지정에도 한도 상한은 적용한다. 요약 바 표시와 "새 계산 시 사용자 지정 해제"를 포함한다.
- **D3 사용자 지정 LTV의 저장 방식** → [ADR-012](../decisions/012-custom-ltv-storage.md)(ADR-001 보강): `Listing`·`LoanInput` 모두 선택 필드 `customLtvRate?`, 판정은 `typeof === "number"`, 규제로 되돌리면 키를 지운다.
- **D5 클라이언트 HTTP 호출** → [ADR-014](../decisions/014-client-http.md)(ADR-003 개정): react-query + fetch 래퍼, 자동 재시도 없음(`retry: false`), axios 없음.
- **D6 실거래가 API 종류와 XML 처리** → [ADR-015](../decisions/015-trade-api-format.md): 상세 자료 API, 파서 이름 `parseTradesResponse`, 응답이 JSON이 되면 JSON·아니면 `fast-xml-parser`, assumed/real fixture 구분, 2-3을 2-1 직후로 당긴다.
- **D7 법정동코드(시군구) 선택** → [ADR-016](../decisions/016-lawd-codes.md): 정적 시군구 목록 한 파일을 클라이언트와 서버가 함께 쓴다.
- **D8 실거래가 화면 위치** → [ADR-017](../decisions/017-trade-sheet.md): 계산 화면의 시트(라우트 2개 유지), 공통 `Sheet` 프레임, 조회 기억은 별도 키, 붙여넣기 적용은 새 매물 계산.
- **D10 통합 테스트 개수** → [ADR-018](../decisions/018-integration-test-cap.md)(ADR-008 개정): 시나리오 8개, 시나리오당 `it` 1개, 상태 렌더링은 표시 컴포넌트·순수 함수로 뺀다.
- **D9 매물 링크 가져오기**: 사용자 확인 대기(U2). 그동안 범위에서 제외하고 붙여넣기로 대체한다.

## 결정 필요

없음. (D9는 위 "결정됨"의 마지막 항목처럼 U2 확인을 기다린다.)

## 사용자 확인 필요

- U1: **공공데이터포털 서비스키 발급과 등록**(사용자만 할 수 있다). ① data.go.kr에서 "국토교통부_아파트 매매 실거래가 상세 자료"(15126468)를 활용신청한다(자동승인). ② 마이페이지의 **Decoding** 인증키를 Cloudflare Pages 프로젝트 → Settings → Variables and Secrets에 `MOLIT_SERVICE_KEY`로, **Production과 Preview 모두** Encrypt로 등록한다. 키에 `%`가 들어 있으면 Encoding 키이니 다른 쪽(Decoding)을 쓴다. ③ 로컬 개발용으로 프로젝트 루트 `.dev.vars`에 같은 값을 넣는다(커밋 금지). Pages 저장소 연결(1차 U3)이 끝나야 Functions 배포와 AC-8을 확인할 수 있다. 등록 전까지 태스크 2는 가짜 응답으로 진행하고, 2-3·2-6만 대기한다. 키가 오면 2-3을 2-1 직후로 당겨 먼저 한다.
- U2: **매물 링크 가져오기를 이번 범위에서 빼고 붙여넣기로 대체해도 되는지**(D9). 요청하신 세 가지 중 하나를 빼는 것이라 제품 범위가 바뀐다. 근거는 "링크 가져오기 조사" 절에 있다(네이버 DB 판례, KB robots 전면 금지, 호갱노노 403). 확인이 올 때까지는 범위에서 제외한다.
- U3: **네이버부동산 공유 텍스트 실제 샘플 2~3개.** 앱에서 매물 → 공유 → 복사한 텍스트를 주면 된다. 매매 2개, 가능하면 전세 1개. 개인 연락처가 들어 있으면 지워도 된다. 형식을 확인하지 못해 가정(A10)으로 만들었으므로 실제 샘플이 있어야 AC-8 T5를 닫는다. 샘플이 오면 파서 코드가 아니라 fixture 파일만 추가한다.
- U4: **S3 FAQ 첨부 PDF 대조.** ([fsc.go.kr/po020201/85466](https://fsc.go.kr/po020201/85466) 첨부 "251017(참고자료) 「10.15 주택시장 안정화 대책」 관련 FAQ.pdf") Q4 표에서 확인할 것: ① 서민·실수요자 행 규제지역 LTV가 60%인지, ② 각주 5)가 그 행에 붙어 있는지, ③ 비교 열 제목이 "비규제지역"(일반)인지. ③이 일반이면 비수도권 서민·실수요자 셀을 70%로 채운다. 1차의 U2(규제지역 생애최초 70% 등)와 같은 파일이니 함께 보면 된다.

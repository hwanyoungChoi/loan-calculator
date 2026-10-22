/**
 * 대출 규제 값은 이 파일 한 곳에만 둔다(CLAUDE.md, ADR-003).
 * 수치는 1차 스펙 "규제 값 (2026-10-21 확인)"과 2차 스펙 "규제 값 (2026-10-22 확인)" 표를 그대로 옮겼다.
 * 확인되지 않은 셀은 `rate: null`로 두고 숫자를 지어내지 않는다.
 * `as const`를 쓰지 않는다. `rate: null` 셀이 리터럴 타입으로 좁아져 미확인 fixture 주입이 막히기 때문이다.
 */
import type {
  PreferredBorrowerRequirements,
  RegulationSource,
  Regulations,
} from "@/lib/types/regulation";

/** 규제 값을 1차 출처와 대조한 날 */
export const REGULATION_BASE_DATE = "2026-10-22";

const S1: RegulationSource = {
  id: "S1",
  title: "가계부채 관리 강화 방안",
  url: "https://www.fsc.go.kr/no010101/84824",
  publishedDate: "2025-06-27",
  effectiveDate: "2025-06-28",
};

const S2: RegulationSource = {
  id: "S2",
  title: "주택시장 안정화를 위한 대출수요 관리 방안(10·15 대책)",
  url: "https://fsc.go.kr/po010105/85432",
  publishedDate: "2025-10-15",
  effectiveDate: "2025-10-16",
};

const S3: RegulationSource = {
  id: "S3",
  title: "10.15 대책 관련 FAQ",
  url: "https://fsc.go.kr/po020201/85466",
  publishedDate: "2025-10-17",
  effectiveDate: null,
};

const S4: RegulationSource = {
  id: "S4",
  title: "규제지역 추가 지정 관련 긴급 가계부채 점검회의",
  url: "https://www.fsc.go.kr/no010101/87222",
  publishedDate: "2026-06-30",
  effectiveDate: "2026-07-01",
};

const S5: RegulationSource = {
  id: "S5",
  title: "2026년도 가계부채 관리방안",
  url: "https://www.fsc.go.kr/no010101/86606",
  publishedDate: "2026-04-01",
  effectiveDate: null,
};

const S6: RegulationSource = {
  id: "S6",
  title: "2026년 9월 가계대출 동향 및 가계부채 점검회의",
  url: "https://www.fsc.go.kr/no010101/87939",
  publishedDate: "2026-10-15",
  effectiveDate: null,
};

export const REGULATION_SOURCES: RegulationSource[] = [S1, S2, S3, S4, S5, S6];

/** 구입 대상 주택 소재지 × 보유 상태. rate는 0~100 정수 퍼센트(ADR-002). */
export const LTV_TABLE = {
  regulated: {
    noHome: { rate: 40, effectiveDate: "2025-10-16", sourceUrl: S2.url },
    firstHome: {
      rate: 70,
      effectiveDate: "2025-06-28",
      sourceUrl: S1.url,
      note: "10·15 대책 이후 유지(S3 FAQ Q4, S4)",
    },
    oneHomeDisposal: {
      rate: 40,
      effectiveDate: "2025-10-16",
      sourceUrl: S2.url,
      note: "무주택자(처분조건부 1주택자 포함)",
    },
    oneHomeKeep: {
      rate: 0,
      effectiveDate: "2025-06-28",
      sourceUrl: S1.url,
      note: "S4에서 재확인",
    },
    noHomePreferred: {
      rate: 60,
      effectiveDate: "2025-10-16",
      sourceUrl: S3.url,
      note: "S3 FAQ Q4 표 서민·실수요자 행 규제지역 열",
    },
  },
  capitalNonRegulated: {
    noHome: {
      rate: 70,
      effectiveDate: "2025-10-16",
      sourceUrl: S2.url,
      note: "비규제지역 70% 유지를 S2에서 확인. 시행일은 S2 시행일",
    },
    firstHome: { rate: 70, effectiveDate: "2025-06-28", sourceUrl: S1.url },
    oneHomeDisposal: { rate: 70, effectiveDate: "2025-06-28", sourceUrl: S1.url },
    oneHomeKeep: { rate: 0, effectiveDate: "2025-06-28", sourceUrl: S1.url },
    noHomePreferred: {
      rate: 70,
      effectiveDate: "2025-10-16",
      sourceUrl: S3.url,
      note: "S3 FAQ Q4 표 서민·실수요자 행 10.15 이전 열(새 규제지역은 그 전에 수도권 비규제)",
    },
  },
  nonCapital: {
    noHome: {
      rate: 70,
      effectiveDate: "2025-10-16",
      sourceUrl: S2.url,
      note: "비규제지역 70% 유지를 S2에서 확인. 시행일은 S2 시행일",
    },
    firstHome: {
      rate: 80,
      effectiveDate: "2025-06-28",
      sourceUrl: S1.url,
      note: 'S1 "지방 현행 유지"(현행 전 지역 80%)',
    },
    oneHomeDisposal: { rate: 70, effectiveDate: "2025-06-28", sourceUrl: S1.url },
    oneHomeKeep: { rate: 60, effectiveDate: "2025-06-28", sourceUrl: S1.url },
    // S3 표의 비교 열이 "비규제지역 일반"인지 원문(첨부 PDF)으로 대조하지 못했다(U4). 확인 전에는 미확인이다.
    noHomePreferred: { rate: null, effectiveDate: null, sourceUrl: null },
  },
} satisfies Regulations["ltvTable"];

/**
 * 주택구입 목적 주담대 한도 상한(만원). 수도권·규제지역에만 적용되고 생애최초도 같은 구간이다(S2, S3).
 * 구간: 15억 이하 6억 / 15억 초과 25억 이하 4억 / 25억 초과 2억.
 */
export const LOAN_CAP = {
  regions: ["regulated", "capitalNonRegulated"],
  tiers: [
    { upTo: 150000, cap: 60000 },
    { upTo: 250000, cap: 40000 },
    { upTo: null, cap: 20000 },
  ],
  effectiveDate: "2025-10-16",
  sourceUrl: S2.url,
} satisfies Regulations["loanCap"];

/**
 * 서민·실수요자 우대 요건(S3 FAQ Q4 각주 5): 부부합산 연소득 9천만원 이하, 주택가격 8억원 이하, 무주택세대주.
 * 앱은 주택가격만 판정하고(max(매매가, KB시세) <= maxHousePrice), 소득·세대주는 안내 문구에만 쓴다.
 */
export const PREFERRED_BORROWER_REQUIREMENTS = {
  maxHousePrice: 80000,
  maxCoupleIncome: 9000,
  householdRequirement: "무주택세대주",
  effectiveDate: "2025-10-16",
  sourceUrl: S3.url,
} satisfies PreferredBorrowerRequirements;

export const LOAN_REGULATIONS = {
  baseDate: REGULATION_BASE_DATE,
  ltvTable: LTV_TABLE,
  loanCap: LOAN_CAP,
  preferredBorrower: PREFERRED_BORROWER_REQUIREMENTS,
  sources: REGULATION_SOURCES,
} satisfies Regulations;

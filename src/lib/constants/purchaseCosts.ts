/**
 * 집을 살 때 드는 부대비용(취득세·지방교육세·농어촌특별세, 중개보수)의 세율·요율은 이 파일 한 곳에만 둔다(ADR-022 D2).
 * 수치는 스펙 `fees-and-default-ltv` "세율·요율 (2026-10-22 확인)" 표를 그대로 옮겼다. 금액은 만원, 세율은 bp(0.01%) 정수다.
 * 확인되지 않은 값은 `null`로 두고 숫자를 지어내지 않는다. `as const`를 쓰지 않는다(미확인 fixture 주입, loanRegulations.ts와 같은 이유).
 *
 * 대조한 공식 안내 페이지:
 * - 송파구청 취득세 계산 https://www.songpa.go.kr/tax/tax_acquisition_house_1_1.html (1%·산식·3%, 지방교육세 본세의 10%, 농특세 0.2%)
 * - 김해시 다주택 중과 안내 https://www.gimhae.go.kr/00610/07901/09195.web (조정대상지역 2주택 8%)
 * - 금천구청 생애최초 감면 안내 https://www.geumcheon.go.kr/portal/contents.do?key=4561 (12억 이하 200만원)
 * - 구리시 중개수수료 요율표 https://www.guri.go.kr/www/contents.do?key=677 (부가가치세 별도)
 * - 인천시 중개보수 요율 안내 https://www.incheon.go.kr/build/BU060102/274 ('21.10.19 이후 계약)
 */
import type {
  AcquisitionTaxRules,
  BrokerageFeeRules,
  PurchaseCostRules,
} from "@/lib/types/regulation";

/** 세율·요율을 1차 출처와 대조한 날 */
export const PURCHASE_COSTS_BASE_DATE = "2026-10-22";

/**
 * 주택 유상거래 취득세. 현행 지방세법은 법률 제21308호(2026-07-01 시행)이고 아래 세율 변경은 없다.
 * 6억 초과 9억 이하 산식 (취득가액 × 2/3억원 − 3) × 1/100은 소수점 이하 다섯째 자리에서 반올림해 넷째 자리까지 쓴다(law.go.kr 원문 확인).
 */
export const ACQUISITION_TAX = {
  flatUpTo: 60000,
  flatRateBp: 100,
  slopeUpTo: 90000,
  topRateBp: 300,
  regulatedSecondHomeRateBp: 800,
  // 일반: 본세의 10%(= 세율 × 50% × 20%). 중과: (4% − 2%) × 20% = 0.4%
  localEducation: { standardShareOfTaxPercent: 10, heavyRateBp: 40 },
  // 일반: 과세표준 × 0.2%(표준세율 2%로 계산한 취득세의 10%). 중과분은 1차 출처로 대조하지 못했다.
  ruralSpecial: { standardRateBp: 20, heavyRateBp: null },
  // 지방세특례제한법 제36조의3 일반 주택 한도(적용기한 2028-12-31)
  firstHomeReliefMax: 200,
  sources: [
    {
      title: "지방세법 제11조 제1항 제8호(주택 유상거래 1~3%)",
      url: "https://www.law.go.kr/법령/지방세법/제11조",
      effectiveDate: "2020-01-01",
    },
    {
      title: "지방세법 제13조의2 제1항(조정대상지역 2주택 8%)",
      url: "https://www.law.go.kr/법령/지방세법/제13조의2",
      effectiveDate: "2020-08-12",
    },
    {
      title: "지방세법 제151조 제1항 제1호(지방교육세)",
      url: "https://www.law.go.kr/법령/지방세법/제151조",
      effectiveDate: null,
      note: "최근 개정 2021-12-28",
    },
    {
      title: "농어촌특별세법 제5조 제1항 제6호",
      url: "https://www.law.go.kr/법령/농어촌특별세법/제5조",
      effectiveDate: null,
      note: "최근 개정 2024-12-31. 전용 85㎡ 이하 비과세. 다주택 중과분은 미확인",
    },
  ],
} satisfies AcquisitionTaxRules;

/** 주택 매매·교환 중개보수 상한(공인중개사법 시행규칙 제20조 제1항 별표1). 구간은 "이상/미만"이다. */
export const BROKERAGE_FEE = {
  tiers: [
    { below: 5000, rateBp: 60, maxFee: 25 },
    { below: 20000, rateBp: 50, maxFee: 80 },
    { below: 90000, rateBp: 40, maxFee: null },
    { below: 120000, rateBp: 50, maxFee: null },
    { below: 150000, rateBp: 60, maxFee: null },
    { below: null, rateBp: 70, maxFee: null },
  ],
  vatPercent: 10,
  sources: [
    {
      title: "공인중개사법 시행규칙 제20조 제1항 별표1",
      url: "https://www.law.go.kr/법령/공인중개사법시행규칙/제20조",
      effectiveDate: "2021-10-19",
      note: "시행 뒤 체결한 계약부터. 부가가치세 별도(구리시 요율표)",
    },
  ],
} satisfies BrokerageFeeRules;

export const PURCHASE_COSTS = {
  baseDate: PURCHASE_COSTS_BASE_DATE,
  acquisitionTax: ACQUISITION_TAX,
  brokerageFee: BROKERAGE_FEE,
} satisfies PurchaseCostRules;

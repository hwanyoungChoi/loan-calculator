import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import {
  calculateLoan,
  evaluateRegulation,
  findCapTier,
  selectCapReferencePrice,
} from "./calculateLoan";

import type { LoanInput, RegulationOutcome } from "@/lib/types/loan";
import type { Borrower, Region, Regulations } from "@/lib/types/regulation";

function input(region: Region, borrower: Borrower, salePrice: number, kbPrice: number): LoanInput {
  return { salePrice, kbPrice, region, borrower };
}

/** 운영 규제를 복제해 한 셀의 rate만 바꾼 fixture. 원본은 건드리지 않는다. */
function withRate(region: Region, borrower: Borrower, rate: number | null): Regulations {
  const regulations: Regulations = structuredClone(LOAN_REGULATIONS);
  regulations.ltvTable[region][borrower] =
    rate === null
      ? { rate: null, effectiveDate: null, sourceUrl: null }
      : { ...regulations.ltvTable[region][borrower], rate };
  return regulations;
}

describe("calculateLoan (AC-1)", () => {
  it("규제·무주택 120000/115000: 담보 115000(KB시세), LTV 금액 46000, 한도 46000, 매매가 − 한도 74000", () => {
    expect(calculateLoan(input("regulated", "noHome", 120000, 115000))).toMatchObject({
      status: "ok",
      collateralBase: 115000,
      collateralSource: "kbPrice",
      ltvAmount: 46000,
      loanLimit: 46000,
      downPayment: 74000,
    });
  });

  it("규제·생애최초 100000/100000: 담보 100000(equal), LTV 금액 70000, 상한 60000, 한도 60000, 매매가 − 한도 40000", () => {
    const result = calculateLoan(input("regulated", "firstHome", 100000, 100000));
    expect(result).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "equal",
      ltvAmount: 70000,
      loanLimit: 60000,
      downPayment: 40000,
    });
    expect(result.cap?.amount).toBe(60000);
  });

  it("규제·무주택 200000/200000: LTV 금액 80000, 상한 40000, 한도 40000, 매매가 − 한도 160000", () => {
    const result = calculateLoan(input("regulated", "noHome", 200000, 200000));
    expect(result).toMatchObject({
      status: "ok",
      ltvAmount: 80000,
      loanLimit: 40000,
      downPayment: 160000,
    });
    expect(result.cap?.amount).toBe(40000);
  });

  it("비수도권·생애최초 50000/48000: 담보 48000, LTV 금액 38400, 상한 없음(null), 한도 38400, 매매가 − 한도 11600", () => {
    expect(calculateLoan(input("nonCapital", "firstHome", 50000, 48000))).toMatchObject({
      status: "ok",
      collateralBase: 48000,
      collateralSource: "kbPrice",
      ltvAmount: 38400,
      cap: null,
      loanLimit: 38400,
      downPayment: 11600,
    });
  });

  it("수도권 비규제·1주택 미처분 80000/80000: 확인된 LTV 0%는 ok이고 한도 0, 매매가 − 한도 80000", () => {
    expect(calculateLoan(input("capitalNonRegulated", "oneHomeKeep", 80000, 80000))).toMatchObject({
      status: "ok",
      ltvAmount: 0,
      loanLimit: 0,
      downPayment: 80000,
    });
  });

  it("내림: 비수도권·무주택 99999/99999는 LTV 금액 69999(69999.3 내림), 한도 69999, 매매가 − 한도 30000", () => {
    expect(calculateLoan(input("nonCapital", "noHome", 99999, 99999))).toMatchObject({
      status: "ok",
      ltvAmount: 69999,
      loanLimit: 69999,
      downPayment: 30000,
    });
  });

  it.each([
    [99995, 69996], // 69996.5: 반올림이면 69997
    [99997, 69997], // 69997.9: 반올림·올림이면 69998
    [15, 10], // 10.5
  ])(
    "내림: 비수도권·무주택(70%) %i → LTV 금액 %i (소수부가 .5 이상이어도 내린다)",
    (price, expected) => {
      const result = calculateLoan(input("nonCapital", "noHome", price, price));
      expect(result.ltvAmount).toBe(expected);
      expect(result.loanLimit).toBe(expected);
      expect(result.downPayment).toBe(price - expected);
    },
  );

  it.each([
    [90, 63],
    [170, 119],
    [180, 126],
  ])(
    "정수 연산: 비수도권·무주택(70%) %i → LTV 금액 %i (부동소수점 오차 없음)",
    (price, expected) => {
      const result = calculateLoan(input("nonCapital", "noHome", price, price));
      expect(result.ltvAmount).toBe(expected);
      expect(result.loanLimit).toBe(expected);
    },
  );

  it("매매가 < KB시세: 규제·무주택 100000/120000은 담보 100000(매매가), LTV 금액 40000, 한도 40000, 매매가 − 한도 60000", () => {
    expect(calculateLoan(input("regulated", "noHome", 100000, 120000))).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "salePrice",
      ltvAmount: 40000,
      loanLimit: 40000,
      downPayment: 60000,
    });
  });

  it("매매가 > KB시세: 규제·무주택 120000/100000은 담보 100000(KB시세), 한도 40000, 매매가 − 한도 80000", () => {
    expect(calculateLoan(input("regulated", "noHome", 120000, 100000))).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "kbPrice",
      loanLimit: 40000,
      downPayment: 80000,
    });
  });

  it("같은 값: 규제·무주택 100000/100000은 collateralSource equal, 한도 40000, 매매가 − 한도 60000", () => {
    expect(calculateLoan(input("regulated", "noHome", 100000, 100000))).toMatchObject({
      status: "ok",
      collateralSource: "equal",
      loanLimit: 40000,
      downPayment: 60000,
    });
  });

  it("regulations를 생략하면 LOAN_REGULATIONS로 계산한다", () => {
    const sample = input("regulated", "firstHome", 125000, 120000);
    expect(calculateLoan(sample)).toEqual(calculateLoan(sample, LOAN_REGULATIONS));
  });
});

describe("필요한 자기자금 = 매매가 − 예상 한도 + 부대비용 (ADR-022 AC-4)", () => {
  it("7억/6억 8,000·규제지역·무주택·70% → 22,400 + 1,286 + 280 = 23,966. 중과 농특세 미확인이면 그 항목만 빼고 계산한다", () => {
    const scenario: LoanInput = {
      ...input("regulated", "noHome", 70000, 68000),
      customLtvRate: 70,
    };
    expect(calculateLoan(scenario)).toMatchObject({
      status: "ok",
      loanLimit: 47600,
      downPayment: 22400,
      purchaseCosts: { acquisitionTax: { total: 1286 }, brokerageFee: { total: 280 }, total: 1566 },
      ownFunds: 23966,
    });

    const heavyOver85: LoanInput = { ...scenario, borrower: "oneHomeKeep", isAreaOver85: true };
    const result = calculateLoan(heavyOver85);
    expect(result.purchaseCosts.acquisitionTax.ruralSpecialTax).toBeNull();
    // 22,400 + 취득세 5,600 + 지방교육세 280 + 중개보수 280
    expect(result.ownFunds).toBe(28560);
  });
});

describe("한도 상한 경계값 (AC-3, 규제지역·생애최초 70%)", () => {
  it.each([
    // 매매가, KB시세, 구간 판단 가격, cap.amount, 한도, isBoundaryCase
    [150000, 150000, 150000, 60000, 60000, false],
    [150001, 150001, 150001, 40000, 40000, false],
    [250000, 250000, 250000, 40000, 40000, false],
    [250001, 250001, 250001, 20000, 20000, false],
    [150000, 150001, 150001, 40000, 40000, true],
    [150001, 150000, 150001, 40000, 40000, true],
    [140000, 160000, 160000, 40000, 40000, true],
    [160000, 140000, 160000, 40000, 40000, true],
    [250000, 250001, 250001, 20000, 20000, true],
  ])(
    "매매가 %i / KB시세 %i → 구간 판단 가격 %i, 상한 %i, 한도 %i, 경계 %s",
    (salePrice, kbPrice, referencePrice, capAmount, loanLimit, isBoundaryCase) => {
      const result = calculateLoan(input("regulated", "firstHome", salePrice, kbPrice));
      expect(result.cap).not.toBeNull();
      expect(result.cap?.capReferencePrice).toBe(referencePrice);
      expect(result.cap?.amount).toBe(capAmount);
      expect(result.cap?.isBoundaryCase).toBe(isBoundaryCase);
      expect(result.loanLimit).toBe(loanLimit);
    },
  );

  it("구간 판단에 쓴 가격의 출처를 돌려준다", () => {
    expect(
      calculateLoan(input("regulated", "firstHome", 140000, 160000)).cap?.capReferenceSource,
    ).toBe("kbPrice");
    expect(
      calculateLoan(input("regulated", "firstHome", 160000, 140000)).cap?.capReferenceSource,
    ).toBe("salePrice");
    expect(
      calculateLoan(input("regulated", "firstHome", 150000, 150000)).cap?.capReferenceSource,
    ).toBe("equal");
  });

  it("수도권 비규제에도 같은 상한 구간을 적용한다", () => {
    const result = calculateLoan(input("capitalNonRegulated", "firstHome", 160000, 160000));
    expect(result.cap?.amount).toBe(40000);
    expect(result.loanLimit).toBe(40000);
  });

  it("비수도권·생애최초(80%) 300000/300000: cap은 null, 한도 240000", () => {
    const result = calculateLoan(input("nonCapital", "firstHome", 300000, 300000));
    expect(result.cap).toBeNull();
    expect(result).toMatchObject({ status: "ok", loanLimit: 240000, downPayment: 60000 });
  });
});

describe("findCapTier (AC-3)", () => {
  const tiers = LOAN_REGULATIONS.loanCap.tiers;

  it.each([
    [1, 0, 60000],
    [150000, 0, 60000],
    [150001, 1, 40000],
    [250000, 1, 40000],
    [250001, 2, 20000],
    [999999999, 2, 20000],
  ])("%i → 구간 %i(상한 %i)", (price, index, cap) => {
    expect(findCapTier(price, tiers)).toEqual({ index, cap });
  });

  it.each([0, -1, -150000])("0 이하(%i)는 범위 밖이라 null", (price) => {
    expect(findCapTier(price, tiers)).toBeNull();
  });
});

describe("selectCapReferencePrice (AC-3, ADR-005: max)", () => {
  it.each([
    [100000, 120000, 120000],
    [120000, 100000, 120000],
    [150000, 150000, 150000],
  ])("매매가 %i, KB시세 %i → %i", (salePrice, kbPrice, expected) => {
    expect(selectCapReferencePrice(salePrice, kbPrice)).toBe(expected);
  });
});

describe("미확인 LTV 처리 (AC-4)", () => {
  it("rate null이면 unconfirmed이고 LTV 금액·한도·자기자금은 null, 담보 기준과 상한은 계산한다", () => {
    const regulations = withRate("regulated", "noHome", null);
    const result = calculateLoan(input("regulated", "noHome", 120000, 115000), regulations);

    expect(result.status).toBe("unconfirmed");
    expect(result.ltvAmount).toBeNull();
    expect(result.loanLimit).toBeNull();
    expect(result.ownFunds).toBeNull();
    expect(result.collateralBase).toBe(115000);
    expect(result.collateralSource).toBe("kbPrice");
    expect(result.cap).not.toBeNull();
    expect(result.cap?.amount).toBe(60000);
    expect(result.cap?.tierIndex).toBe(0);
  });

  it("미확인이어도 상한 구간 판단과 경계 판정은 그대로 한다", () => {
    const regulations = withRate("regulated", "firstHome", null);
    const result = calculateLoan(input("regulated", "firstHome", 140000, 160000), regulations);

    expect(result.status).toBe("unconfirmed");
    expect(result.cap?.amount).toBe(40000);
    expect(result.cap?.isBoundaryCase).toBe(true);
  });

  it("상한이 없는 지역의 미확인은 cap null, 담보 기준은 계산한다", () => {
    const regulations = withRate("nonCapital", "firstHome", null);
    const result = calculateLoan(input("nonCapital", "firstHome", 50000, 48000), regulations);

    expect(result.status).toBe("unconfirmed");
    expect(result.collateralBase).toBe(48000);
    expect(result.cap).toBeNull();
    expect(result.loanLimit).toBeNull();
  });

  it("rate 0 fixture는 미확인이 아니라 ok이고 한도 0, 매매가 − 한도는 매매가 전액", () => {
    const regulations = withRate("regulated", "noHome", 0);
    expect(calculateLoan(input("regulated", "noHome", 120000, 115000), regulations)).toMatchObject({
      status: "ok",
      ltvAmount: 0,
      loanLimit: 0,
      downPayment: 120000,
    });
  });

  it("fixture로 바꾼 셀만 영향을 받고 운영 규제는 그대로다", () => {
    withRate("regulated", "noHome", null);
    expect(LOAN_REGULATIONS.ltvTable.regulated.noHome.rate).toBe(40);
  });
});

/** 사용자 지정 LTV를 붙인 입력 */
function custom(
  region: Region,
  borrower: Borrower,
  salePrice: number,
  kbPrice: number,
  customLtvRate: number,
): LoanInput {
  return { ...input(region, borrower, salePrice, kbPrice), customLtvRate };
}

describe("서민·실수요자 LTV와 요건 판정 (AC-1b)", () => {
  it("규제지역 70000/70000 → ok, 규제 LTV 60%, 한도 42000, 매매가 − 한도 28000", () => {
    expect(calculateLoan(input("regulated", "noHomePreferred", 70000, 70000))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "regulation", rate: 60 },
      ltvAmount: 42000,
      loanLimit: 42000,
      downPayment: 28000,
    });
  });

  it("규제지역 80000/79000 → ok(판정가 80000은 요건 이내), 담보 79000(KB시세), LTV 금액 47400", () => {
    expect(calculateLoan(input("regulated", "noHomePreferred", 80000, 79000))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "regulation", rate: 60 },
      collateralBase: 79000,
      collateralSource: "kbPrice",
      ltvAmount: 47400,
      loanLimit: 47400,
      downPayment: 32600,
    });
  });

  it("경계: 80000/80000은 ok(8억 이하 충족), 80001/80001은 ineligible이고 판정가 출처는 equal", () => {
    expect(calculateLoan(input("regulated", "noHomePreferred", 80000, 80000))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "regulation", rate: 60 },
      ltvAmount: 48000,
    });
    expect(calculateLoan(input("regulated", "noHomePreferred", 80001, 80001))).toMatchObject({
      status: "ineligible",
      reason: "housePriceOverLimit",
      eligibilityPrice: 80001,
      eligibilityPriceSource: "equal",
    });
  });

  it("80001/79000 → ineligible, 판정가 80001(매매가). 담보 기준과 상한은 계산하고 나머지는 null", () => {
    const result = calculateLoan(input("regulated", "noHomePreferred", 80001, 79000));
    expect(result).toEqual({
      status: "ineligible",
      reason: "housePriceOverLimit",
      eligibilityPrice: 80001,
      eligibilityPriceSource: "salePrice",
      collateralBase: 79000,
      collateralSource: "kbPrice",
      cap: expect.objectContaining({ amount: 60000, tierIndex: 0, capReferencePrice: 80001 }),
      appliedLtv: null,
      ltvAmount: null,
      loanLimit: null,
      downPayment: null,
      ownFunds: null,
      purchaseCosts: expect.anything(),
    });
  });

  it("79000/80001 → ineligible, 판정가 80001(KB시세). 매매가만 보면 놓친다", () => {
    expect(calculateLoan(input("regulated", "noHomePreferred", 79000, 80001))).toMatchObject({
      status: "ineligible",
      eligibilityPrice: 80001,
      eligibilityPriceSource: "kbPrice",
      collateralBase: 79000,
      collateralSource: "salePrice",
    });
  });

  it("수도권 비규제 70000/70000 → LTV 70%, LTV 금액 49000. 80001/80001은 지역과 무관하게 ineligible", () => {
    expect(
      calculateLoan(input("capitalNonRegulated", "noHomePreferred", 70000, 70000)),
    ).toMatchObject({
      status: "ok",
      appliedLtv: { source: "regulation", rate: 70 },
      ltvAmount: 49000,
    });
    expect(
      calculateLoan(input("capitalNonRegulated", "noHomePreferred", 80001, 80001)).status,
    ).toBe("ineligible");
  });

  it("규칙 순서: 비수도권(셀 null)에서 90000/90000은 ineligible(요건이 먼저), 70000/70000은 unconfirmed", () => {
    expect(LOAN_REGULATIONS.ltvTable.nonCapital.noHomePreferred.rate).toBeNull();
    expect(calculateLoan(input("nonCapital", "noHomePreferred", 90000, 90000))).toMatchObject({
      status: "ineligible",
      eligibilityPrice: 90000,
      cap: null,
      loanLimit: null,
    });
    expect(calculateLoan(input("nonCapital", "noHomePreferred", 70000, 70000))).toMatchObject({
      status: "unconfirmed",
      loanLimit: null,
    });
  });

  it("ineligible의 상한 구간은 max(매매가, KB시세) 기준이다: 79000/150001 → 상한 4억(15억 초과 구간)", () => {
    const result = calculateLoan(input("regulated", "noHomePreferred", 79000, 150001));
    expect(result.status).toBe("ineligible");
    expect(result.collateralBase).toBe(79000);
    expect(result.cap).toMatchObject({
      amount: 40000,
      tierIndex: 1,
      capReferencePrice: 150001,
      capReferenceSource: "kbPrice",
    });
  });

  it("다른 보유 상태는 8억을 넘어도 요건 판정을 하지 않는다", () => {
    expect(calculateLoan(input("regulated", "noHome", 90000, 90000)).status).toBe("ok");
    expect(calculateLoan(input("regulated", "firstHome", 90000, 90000)).status).toBe("ok");
  });

  it("판정 상한은 규제 파일 값(regulations.preferredBorrower)을 따른다", () => {
    const regulations: Regulations = structuredClone(LOAN_REGULATIONS);
    regulations.preferredBorrower.maxHousePrice = 70000;
    expect(
      calculateLoan(input("regulated", "noHomePreferred", 70000, 70000), regulations).status,
    ).toBe("ok");
    expect(
      calculateLoan(input("regulated", "noHomePreferred", 70001, 70001), regulations).status,
    ).toBe("ineligible");
  });
});

describe("evaluateRegulation (ADR-013 규칙 2·3·4)", () => {
  it.each<[string, LoanInput, Regulations, RegulationOutcome]>([
    [
      "규제 LTV",
      input("regulated", "noHome", 100000, 100000),
      LOAN_REGULATIONS,
      { status: "ok", rate: 40 },
    ],
    [
      "확인된 0%",
      input("regulated", "oneHomeKeep", 100000, 100000),
      LOAN_REGULATIONS,
      { status: "ok", rate: 0 },
    ],
    [
      "요건 미충족",
      input("regulated", "noHomePreferred", 80001, 1),
      LOAN_REGULATIONS,
      { status: "ineligible" },
    ],
    [
      "미확인 셀",
      input("nonCapital", "noHomePreferred", 70000, 70000),
      LOAN_REGULATIONS,
      { status: "unconfirmed" },
    ],
    [
      "요건 미충족이 미확인보다 먼저",
      input("nonCapital", "noHomePreferred", 90000, 90000),
      LOAN_REGULATIONS,
      { status: "ineligible" },
    ],
    [
      "fixture 미확인",
      input("regulated", "noHome", 100000, 100000),
      withRate("regulated", "noHome", null),
      { status: "unconfirmed" },
    ],
  ])("%s", (_, loanInput, regulations, expected) => {
    expect(evaluateRegulation(loanInput, regulations)).toEqual(expected);
  });

  it("customLtvRate가 있어도 규제 결과만 본다", () => {
    expect(
      evaluateRegulation(custom("regulated", "noHome", 100000, 100000, 70), LOAN_REGULATIONS),
    ).toEqual({ status: "ok", rate: 40 });
  });
});

describe("사용자 지정 LTV 계산 (AC-2b, ADR-013 상한 유지)", () => {
  it("규제지역·무주택 100000/100000, 70 → custom 70(규제 기준 ok 40), LTV 금액 70000, 상한 60000, 한도 60000", () => {
    const result = calculateLoan(custom("regulated", "noHome", 100000, 100000, 70));
    expect(result).toMatchObject({
      status: "ok",
      appliedLtv: { source: "custom", rate: 70, regulation: { status: "ok", rate: 40 } },
      ltvAmount: 70000,
      loanLimit: 60000,
      downPayment: 40000,
    });
    expect(result.appliedLtv).toEqual({
      source: "custom",
      rate: 70,
      regulation: { status: "ok", rate: 40 },
    });
    expect(result.cap?.amount).toBe(60000);
  });

  it("200000/200000, 70 → LTV 금액 140000, 상한 40000, 한도 40000", () => {
    const result = calculateLoan(custom("regulated", "noHome", 200000, 200000, 70));
    expect(result).toMatchObject({ ltvAmount: 140000, loanLimit: 40000, downPayment: 160000 });
    expect(result.cap?.amount).toBe(40000);
  });

  it.each([
    // 매매가=KB시세, 사용자 지정, LTV 금액, 상한, 한도
    [150000, 100, 150000, 60000, 60000],
    [150001, 100, 150001, 40000, 40000],
    [100000, 30, 30000, 60000, 30000],
    [100000, 100, 100000, 60000, 60000],
  ])(
    "상한 경계: 규제지역·무주택 %i/%i, %i% → LTV 금액 %i, 상한 %i, 한도 %i",
    (price, rate, ltvAmount, cap, loanLimit) => {
      const result = calculateLoan(custom("regulated", "noHome", price, price, rate));
      expect(result.status).toBe("ok");
      expect(result.appliedLtv?.source).toBe("custom");
      expect(result.ltvAmount).toBe(ltvAmount);
      expect(result.cap?.amount).toBe(cap);
      expect(result.loanLimit).toBe(loanLimit);
      expect(result.downPayment).toBe(price - loanLimit);
    },
  );

  it("비수도권·무주택 99995/99995, 70 → 69996(내림), 상한 없음이라 한도 = LTV 금액", () => {
    expect(calculateLoan(custom("nonCapital", "noHome", 99995, 99995, 70))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "custom", rate: 70 },
      cap: null,
      ltvAmount: 69996,
      loanLimit: 69996,
      downPayment: 29999,
    });
  });

  it("매매가 ≠ KB시세 100000/90000, 70 → 담보 90000(KB시세) 기준 LTV 금액 63000", () => {
    expect(calculateLoan(custom("regulated", "noHome", 100000, 90000, 70))).toMatchObject({
      collateralBase: 90000,
      collateralSource: "kbPrice",
      ltvAmount: 63000,
      loanLimit: 60000,
      downPayment: 40000,
    });
  });

  it("0 → 미확인이 아니라 ok, 한도 0, 매매가 − 한도는 매매가 전액", () => {
    expect(calculateLoan(custom("regulated", "noHome", 100000, 90000, 0))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "custom", rate: 0 },
      ltvAmount: 0,
      loanLimit: 0,
      downPayment: 100000,
    });
  });

  it("키가 없거나 값이 undefined면 규제 LTV다(typeof 판정, ADR-012)", () => {
    const withoutKey = input("regulated", "noHome", 100000, 100000);
    const undefinedValue = { ...withoutKey, customLtvRate: undefined };
    expect(Object.hasOwn(withoutKey, "customLtvRate")).toBe(false);
    for (const loanInput of [withoutKey, undefinedValue]) {
      expect(calculateLoan(loanInput)).toMatchObject({
        status: "ok",
        appliedLtv: { source: "regulation", rate: 40 },
        loanLimit: 40000,
      });
    }
  });
});

describe("사용자 지정 LTV의 규제 결과 병기 (AC-2c)", () => {
  it("규제 셀이 null인 fixture에서 70 → ok, regulation unconfirmed", () => {
    const regulations = withRate("regulated", "noHome", null);
    expect(
      calculateLoan(custom("regulated", "noHome", 100000, 100000, 70), regulations),
    ).toMatchObject({
      status: "ok",
      appliedLtv: { source: "custom", rate: 70, regulation: { status: "unconfirmed" } },
      ltvAmount: 70000,
      loanLimit: 60000,
    });
  });

  it("ineligible 조건(서민·실수요자 90000/90000)에서 60 → 사용자 지정이 우선해 ok, regulation ineligible", () => {
    expect(calculateLoan(custom("regulated", "noHomePreferred", 90000, 90000, 60))).toMatchObject({
      status: "ok",
      appliedLtv: { source: "custom", rate: 60, regulation: { status: "ineligible" } },
      ltvAmount: 54000,
      loanLimit: 54000,
      downPayment: 36000,
    });
  });

  it.each<[Region, Borrower, number, RegulationOutcome]>([
    ["regulated", "noHome", 100000, { status: "ok", rate: 40 }],
    ["regulated", "firstHome", 100000, { status: "ok", rate: 70 }],
    ["regulated", "oneHomeKeep", 100000, { status: "ok", rate: 0 }],
    ["regulated", "noHomePreferred", 70000, { status: "ok", rate: 60 }],
    ["capitalNonRegulated", "noHomePreferred", 70000, { status: "ok", rate: 70 }],
    ["nonCapital", "noHomePreferred", 70000, { status: "unconfirmed" }],
    ["nonCapital", "noHomePreferred", 90000, { status: "ineligible" }],
  ])("%s × %s %i → regulation %j", (region, borrower, price, regulation) => {
    expect(calculateLoan(custom(region, borrower, price, price, 50)).appliedLtv).toEqual({
      source: "custom",
      rate: 50,
      regulation,
    });
  });
});

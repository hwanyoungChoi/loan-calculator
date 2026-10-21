import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import { calculateLoan, findCapTier, selectCapReferencePrice } from "./calculateLoan";

import type { LoanInput } from "@/lib/types/loan";
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
  it("규제·무주택 120000/115000: 담보 115000(KB시세), LTV 금액 46000, 한도 46000, 자기자금 74000", () => {
    expect(calculateLoan(input("regulated", "noHome", 120000, 115000))).toMatchObject({
      status: "ok",
      collateralBase: 115000,
      collateralSource: "kbPrice",
      ltvAmount: 46000,
      loanLimit: 46000,
      ownFunds: 74000,
    });
  });

  it("규제·생애최초 100000/100000: 담보 100000(equal), LTV 금액 70000, 상한 60000, 한도 60000, 자기자금 40000", () => {
    const result = calculateLoan(input("regulated", "firstHome", 100000, 100000));
    expect(result).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "equal",
      ltvAmount: 70000,
      loanLimit: 60000,
      ownFunds: 40000,
    });
    expect(result.cap?.amount).toBe(60000);
  });

  it("규제·무주택 200000/200000: LTV 금액 80000, 상한 40000, 한도 40000, 자기자금 160000", () => {
    const result = calculateLoan(input("regulated", "noHome", 200000, 200000));
    expect(result).toMatchObject({
      status: "ok",
      ltvAmount: 80000,
      loanLimit: 40000,
      ownFunds: 160000,
    });
    expect(result.cap?.amount).toBe(40000);
  });

  it("비수도권·생애최초 50000/48000: 담보 48000, LTV 금액 38400, 상한 없음(null), 한도 38400, 자기자금 11600", () => {
    expect(calculateLoan(input("nonCapital", "firstHome", 50000, 48000))).toMatchObject({
      status: "ok",
      collateralBase: 48000,
      collateralSource: "kbPrice",
      ltvAmount: 38400,
      cap: null,
      loanLimit: 38400,
      ownFunds: 11600,
    });
  });

  it("수도권 비규제·1주택 미처분 80000/80000: 확인된 LTV 0%는 ok이고 한도 0, 자기자금 80000", () => {
    expect(calculateLoan(input("capitalNonRegulated", "oneHomeKeep", 80000, 80000))).toMatchObject({
      status: "ok",
      ltvAmount: 0,
      loanLimit: 0,
      ownFunds: 80000,
    });
  });

  it("내림: 비수도권·무주택 99999/99999는 LTV 금액 69999(69999.3 내림), 한도 69999, 자기자금 30000", () => {
    expect(calculateLoan(input("nonCapital", "noHome", 99999, 99999))).toMatchObject({
      status: "ok",
      ltvAmount: 69999,
      loanLimit: 69999,
      ownFunds: 30000,
    });
  });

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

  it("매매가 < KB시세: 규제·무주택 100000/120000은 담보 100000(매매가), LTV 금액 40000, 한도 40000, 자기자금 60000", () => {
    expect(calculateLoan(input("regulated", "noHome", 100000, 120000))).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "salePrice",
      ltvAmount: 40000,
      loanLimit: 40000,
      ownFunds: 60000,
    });
  });

  it("매매가 > KB시세: 규제·무주택 120000/100000은 담보 100000(KB시세), 한도 40000, 자기자금 80000", () => {
    expect(calculateLoan(input("regulated", "noHome", 120000, 100000))).toMatchObject({
      status: "ok",
      collateralBase: 100000,
      collateralSource: "kbPrice",
      loanLimit: 40000,
      ownFunds: 80000,
    });
  });

  it("같은 값: 규제·무주택 100000/100000은 collateralSource equal, 한도 40000, 자기자금 60000", () => {
    expect(calculateLoan(input("regulated", "noHome", 100000, 100000))).toMatchObject({
      status: "ok",
      collateralSource: "equal",
      loanLimit: 40000,
      ownFunds: 60000,
    });
  });

  it("regulations를 생략하면 LOAN_REGULATIONS로 계산한다", () => {
    const sample = input("regulated", "firstHome", 125000, 120000);
    expect(calculateLoan(sample)).toEqual(calculateLoan(sample, LOAN_REGULATIONS));
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
    expect(result).toMatchObject({ status: "ok", loanLimit: 240000, ownFunds: 60000 });
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

  it("rate 0 fixture는 미확인이 아니라 ok이고 한도 0, 자기자금은 매매가 전액", () => {
    const regulations = withRate("regulated", "noHome", 0);
    expect(calculateLoan(input("regulated", "noHome", 120000, 115000), regulations)).toMatchObject({
      status: "ok",
      ltvAmount: 0,
      loanLimit: 0,
      ownFunds: 120000,
    });
  });

  it("fixture로 바꾼 셀만 영향을 받고 운영 규제는 그대로다", () => {
    withRate("regulated", "noHome", null);
    expect(LOAN_REGULATIONS.ltvTable.regulated.noHome.rate).toBe(40);
  });
});

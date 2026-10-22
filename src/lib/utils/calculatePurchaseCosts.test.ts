import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";

import { calculatePurchaseCosts } from "./calculatePurchaseCosts";

import type { LoanInput } from "@/lib/types/loan";
import type { Borrower, Region, Regulations } from "@/lib/types/regulation";

function input(
  salePrice: number,
  borrower: Borrower = "noHome",
  region: Region = "regulated",
  isAreaOver85 = false,
): LoanInput {
  return { salePrice, kbPrice: salePrice, region, borrower, ...(isAreaOver85 && { isAreaOver85 }) };
}

/** 중과 농특세 세율이 채워졌다고 가정한 fixture. 값은 테스트용이고 출처 수치가 아니다. */
function withHeavyRuralRateBp(heavyRateBp: number): Regulations {
  const regulations: Regulations = structuredClone(LOAN_REGULATIONS);
  regulations.purchaseCosts.acquisitionTax.ruralSpecial.heavyRateBp = heavyRateBp;
  return regulations;
}

describe("calculatePurchaseCosts: 취득세 (만원, 항목별 올림)", () => {
  it.each<[string, LoanInput, number, boolean, number, number, number | null]>([
    // 이름, 입력, 세율 bp, 중과, 본세, 지방교육세, 농특세
    ["5억 무주택 → 1%", input(50000), 100, false, 500, 50, 0],
    ["6억 → 1%(가목 상단)", input(60000), 100, false, 600, 60, 0],
    ["6억 1만 → 100bp(100.0067 반올림)", input(60001), 100, false, 601, 61, 0],
    ["6억 75만 → 101bp(100.5 반올림)", input(60075), 101, false, 607, 61, 0],
    ["7억 → 167bp", input(70000), 167, false, 1169, 117, 0],
    ["9억 → 300bp(나목 상단)", input(90000), 300, false, 2700, 270, 0],
    ["9억 1만 → 3%(다목)", input(90001), 300, false, 2701, 271, 0],
    [
      "10억 85㎡ 초과 → 농특세 0.2%",
      input(100000, "noHome", "regulated", true),
      300,
      false,
      3000,
      300,
      200,
    ],
    ["10억 1주택 미처분·규제지역 → 중과 8%", input(100000, "oneHomeKeep"), 800, true, 8000, 400, 0],
    [
      "같은 조건 수도권 비규제 → 일반 3%",
      input(100000, "oneHomeKeep", "capitalNonRegulated"),
      300,
      false,
      3000,
      300,
      0,
    ],
    [
      "1주택 처분조건부·규제지역 → 일반 3%(일시적 2주택)",
      input(100000, "oneHomeDisposal"),
      300,
      false,
      3000,
      300,
      0,
    ],
    [
      "중과 + 85㎡ 초과 → 농특세 미확인(null), 합계에서 뺀다",
      input(100000, "oneHomeKeep", "regulated", true),
      800,
      true,
      8000,
      400,
      null,
    ],
  ])("%s", (_, loanInput, rateBp, isHeavy, tax, localEducationTax, ruralSpecialTax) => {
    expect(calculatePurchaseCosts(loanInput, LOAN_REGULATIONS).acquisitionTax).toEqual({
      rateBp,
      isHeavy,
      tax,
      localEducationTax,
      ruralSpecialTax,
      total: tax + localEducationTax + (ruralSpecialTax ?? 0),
    });
  });

  it("미확인은 상수 값(null)으로 정한다: 중과 농특세 세율이 채워지면 중과 + 85㎡ 초과도 계산한다", () => {
    const costs = calculatePurchaseCosts(
      input(100000, "oneHomeKeep", "regulated", true),
      withHeavyRuralRateBp(60),
    );
    expect(costs.acquisitionTax).toMatchObject({ ruralSpecialTax: 600, total: 9000 });
  });
});

describe("calculatePurchaseCosts: 중개보수 (상한 요율, 부가세 10% 포함, 이상/미만)", () => {
  it.each<[number, number, boolean, number, number]>([
    // 매매가, 요율 bp, 한도 적용, 보수, 부가세
    [4000, 60, false, 24, 3],
    [4999, 60, true, 25, 3],
    [5000, 50, false, 25, 3],
    [15000, 50, false, 75, 8],
    [19000, 50, true, 80, 8],
    [19999, 50, true, 80, 8],
    [20000, 40, false, 80, 8],
    [50000, 40, false, 200, 20],
    [89999, 40, false, 360, 36],
    [90000, 50, false, 450, 45],
    [119999, 50, false, 600, 60],
    [120000, 60, false, 720, 72],
    [150000, 70, false, 1050, 105],
  ])("%i만원 → %ibp, 한도 %s, 보수 %i + 부가세 %i", (salePrice, rateBp, isCapped, fee, vat) => {
    expect(calculatePurchaseCosts(input(salePrice), LOAN_REGULATIONS).brokerageFee).toEqual({
      rateBp,
      isCapped,
      fee,
      vat,
      total: fee + vat,
    });
  });
});

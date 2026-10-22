import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { withUnconfirmedCell } from "@/test/listingFixture";

import { describeSummaryTag } from "./summaryTag";

describe("describeSummaryTag (고정 요약 바 태그, ADR-013)", () => {
  it("입력이 없으면 태그 없음", () => {
    expect(describeSummaryTag(null)).toBeNull();
  });

  it("규제 LTV ok는 태그 없음", () => {
    expect(
      describeSummaryTag(
        calculateLoan({
          salePrice: 100000,
          kbPrice: 100000,
          region: "regulated",
          borrower: "noHome",
        }),
      ),
    ).toBeNull();
  });

  it("ineligible이면 '요건 미충족'", () => {
    expect(
      describeSummaryTag(
        calculateLoan({
          salePrice: 85000,
          kbPrice: 84000,
          region: "regulated",
          borrower: "noHomePreferred",
        }),
      ),
    ).toBe("요건 미충족");
  });

  it("미확인은 1차처럼 태그 없음", () => {
    const regulations = withUnconfirmedCell("regulated", "noHome");
    expect(
      describeSummaryTag(
        calculateLoan(
          { salePrice: 100000, kbPrice: 100000, region: "regulated", borrower: "noHome" },
          regulations,
        ),
      ),
    ).toBeNull();
  });

  it.each([70, 0])(
    "사용자 지정이면 '사용자 지정 LTV %i%'(규제 기준이 요건 미충족이어도)",
    (rate) => {
      expect(
        describeSummaryTag(
          calculateLoan(
            {
              salePrice: 90000,
              kbPrice: 90000,
              region: "regulated",
              borrower: "noHomePreferred",
              customLtvRate: rate,
            },
            LOAN_REGULATIONS,
          ),
        ),
      ).toBe(`사용자 지정 LTV ${rate}%`);
    },
  );
});

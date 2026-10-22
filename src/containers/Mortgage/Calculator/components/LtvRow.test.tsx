// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { withUnconfirmedCell } from "@/test/listingFixture";

import LtvRow from "./LtvRow";
import RegulationBasis from "./RegulationBasis";

import type { LoanInput } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

const WARNING = /규제 LTV보다 높습니다/;
const CAP_NOTE = "한도 상한은 규제대로 적용";

function renderRow(input: LoanInput, regulations: Regulations = LOAN_REGULATIONS) {
  return render(
    <dl>
      <LtvRow result={calculateLoan(input, regulations)} />
    </dl>,
  );
}

function custom(patch: Partial<LoanInput>): LoanInput {
  return {
    salePrice: 100000,
    kbPrice: 100000,
    region: "regulated",
    borrower: "noHome",
    customLtvRate: 70,
    ...patch,
  };
}

describe("LtvRow: 사용자 지정 LTV 표시 (AC-2d 표시 규칙)", () => {
  it("ok 규제 기준: '사용자 지정 LTV 70%', '규제 기준 40%', 상한 문구, 70 > 40이라 경고", () => {
    renderRow(custom({}));
    expect(screen.getByText("사용자 지정 LTV 70%")).toBeInTheDocument();
    expect(screen.getByText("규제 기준 40%")).toBeInTheDocument();
    expect(screen.getByText(CAP_NOTE)).toBeInTheDocument();
    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it.each([40, 39, 0])("규제 이하(%i)면 경고가 없다(엄격히 클 때만)", (rate) => {
    renderRow(custom({ customLtvRate: rate }));
    expect(screen.getByText(`규제 기준 40%`)).toBeInTheDocument();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it("41이면 경고가 있다(경계 바로 위)", () => {
    renderRow(custom({ customLtvRate: 41 }));
    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it("규제 기준이 ineligible이면 '규제 기준: 서민·실수요자 요건 미충족'이고 경고는 없다", () => {
    renderRow(
      custom({ borrower: "noHomePreferred", salePrice: 90000, kbPrice: 90000, customLtvRate: 60 }),
    );
    expect(screen.getByText("규제 기준: 서민·실수요자 요건 미충족")).toBeInTheDocument();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it("규제 셀이 미확인인 fixture면 '규제 기준 미확인'이고 경고는 없다", () => {
    renderRow(custom({ customLtvRate: 90 }), withUnconfirmedCell("regulated", "noHome"));
    expect(screen.getByText("규제 기준 미확인")).toBeInTheDocument();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it("상한 없는 지역(비수도권)이면 상한 문구가 없다", () => {
    renderRow(custom({ region: "nonCapital" }));
    expect(screen.getByText("규제 기준 70%")).toBeInTheDocument();
    expect(screen.queryByText(CAP_NOTE)).not.toBeInTheDocument();
  });

  it("규제 LTV(source regulation)면 '규제 기준' 줄이 없다", () => {
    renderRow({ salePrice: 100000, kbPrice: 100000, region: "regulated", borrower: "noHome" });
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.queryByText(/규제 기준/)).not.toBeInTheDocument();
    expect(screen.queryByText(CAP_NOTE)).not.toBeInTheDocument();
  });

  it("ineligible 결과는 '요건 미충족' 배지다", () => {
    renderRow({
      salePrice: 85000,
      kbPrice: 84000,
      region: "regulated",
      borrower: "noHomePreferred",
    });
    expect(screen.getByText("요건 미충족")).toBeInTheDocument();
  });
});

describe("RegulationBasis: 사용자 지정 근거 표시", () => {
  function renderBasis(input: LoanInput) {
    render(
      <RegulationBasis
        input={input}
        result={calculateLoan(input, LOAN_REGULATIONS)}
        regulations={LOAN_REGULATIONS}
      />,
    );
  }

  it("사용자 지정이면 근거 목록 맨 위에 'LTV: 사용자 입력(규제 근거 아님)'", () => {
    renderBasis(custom({}));
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("LTV: 사용자 입력(규제 근거 아님)");
  });

  it("규제 LTV면 그 문구가 없다", () => {
    renderBasis({ salePrice: 100000, kbPrice: 100000, region: "regulated", borrower: "noHome" });
    expect(screen.queryByText("LTV: 사용자 입력(규제 근거 아님)")).not.toBeInTheDocument();
  });

  it("서민·실수요자면 요건 출처 링크와 시행일을 보인다", () => {
    renderBasis({
      salePrice: 70000,
      kbPrice: 70000,
      region: "regulated",
      borrower: "noHomePreferred",
    });
    const item = screen.getByText("서민·실수요자 요건").closest("li");
    expect(item).toHaveTextContent(`시행 ${LOAN_REGULATIONS.preferredBorrower.effectiveDate}`);
    expect(item?.querySelector("a")).toHaveAttribute(
      "href",
      LOAN_REGULATIONS.preferredBorrower.sourceUrl,
    );
  });
});

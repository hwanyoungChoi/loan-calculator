// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LOAN_REGULATIONS, REGULATION_BASE_DATE } from "@/lib/constants/loanRegulations";

import ResultCard from "./ResultCard";

import type { LoanInput } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

/** 규제지역·무주택 셀만 미확인으로 바꾼 fixture */
function unconfirmedRegulations(): Regulations {
  const regulations: Regulations = structuredClone(LOAN_REGULATIONS);
  regulations.ltvTable.regulated.noHome = { rate: null, effectiveDate: null, sourceUrl: null };
  return regulations;
}

function card() {
  return screen.getByRole("region", { name: "계산 결과" });
}

/** 결과 카드에서 라벨(dt) 옆의 값(첫 dd) */
function rowValue(label: string): string {
  const term = within(card()).getByText(label, { selector: "dt" });
  return term.parentElement?.querySelector("dd")?.textContent ?? "";
}

function expectSafeExternalLinks() {
  const links = within(card()).getAllByRole("link");
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  return links;
}

const INPUT: LoanInput = {
  salePrice: 125000,
  kbPrice: 120000,
  region: "regulated",
  borrower: "noHome",
};

describe("결과 카드 (통합)", () => {
  it("#2 미확인 fixture는 미확인 배지와 —를 보이고 한도·자기자금 숫자가 없다. 기준일과 근거 링크도 표시한다 (AC-4, AC-5d)", () => {
    const regulations = unconfirmedRegulations();
    const { rerender } = render(<ResultCard input={INPUT} regulations={regulations} />);

    // 미확인: 배지, —, 안내 문구
    expect(within(card()).getByText("미확인")).toBeInTheDocument();
    expect(rowValue("적용 LTV")).toBe("미확인");
    expect(rowValue("LTV 금액")).toBe("—");
    expect(rowValue("예상 한도")).toBe("—");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("—");
    expect(
      within(card()).getByText("이 조건의 LTV는 1차 출처로 확인되지 않아 계산하지 않습니다"),
    ).toBeInTheDocument();
    // 0이나 다른 조합 값으로 채우지 않는다.
    expect(within(card()).queryByText(/^0만원$/)).not.toBeInTheDocument();

    // 담보 기준과 한도 상한은 미확인과 무관하게 계산해 보여준다.
    expect(rowValue("담보 기준")).toBe("12억원(KB시세)");
    expect(rowValue("한도 상한")).toBe("6억원");

    // 기준일은 리터럴이 아니라 상수와 비교한다.
    expect(
      within(card()).getByText(new RegExp(`규제 기준일 ${REGULATION_BASE_DATE}`)),
    ).toBeVisible();
    expect(within(card()).getByText("근거 보기")).toBeInTheDocument();
    const links = expectSafeExternalLinks();
    expect(links.map((link) => link.getAttribute("href"))).toContain(regulations.loanCap.sourceUrl);

    // 확인된 0%(규제지역·1주택 미처분)는 미확인과 구분해 숫자로 보여준다.
    rerender(
      <ResultCard input={{ ...INPUT, borrower: "oneHomeKeep" }} regulations={LOAN_REGULATIONS} />,
    );
    expect(within(card()).queryByText("미확인")).not.toBeInTheDocument();
    expect(rowValue("적용 LTV")).toBe("LTV 0% · 주택구입 목적 주담대 불가");
    expect(rowValue("예상 한도")).toBe("0만원");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("12억 5,000만원");
    expect(
      within(card()).queryByText("이 조건의 LTV는 1차 출처로 확인되지 않아 계산하지 않습니다"),
    ).not.toBeInTheDocument();
    const confirmedLinks = expectSafeExternalLinks();
    expect(confirmedLinks.map((link) => link.getAttribute("href"))).toContain(
      LOAN_REGULATIONS.ltvTable.regulated.oneHomeKeep.sourceUrl,
    );
  });
});

// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import MortgageCalculator from "./MortgageCalculator";

function resultCard() {
  return screen.getByRole("region", { name: "계산 결과" });
}

/** 결과 카드에서 라벨(dt) 옆의 값(첫 dd) */
function rowValue(label: string): string {
  const term = within(resultCard()).getByText(label, { selector: "dt" });
  return term.parentElement?.querySelector("dd")?.textContent ?? "";
}

describe("계산 화면 (통합)", () => {
  it("#1 매매가에 0을 입력하고 blur하면 그 필드 아래에 오류가 뜨고 저장 시트가 열리지 않는다 (AC-8b)", async () => {
    const user = userEvent.setup();
    render(<MortgageCalculator />);

    const salePrice = screen.getByLabelText("매매가");
    const kbPrice = screen.getByLabelText("KB시세");

    expect(salePrice).toHaveAttribute("inputmode", "numeric");
    expect(kbPrice).toHaveAttribute("inputmode", "numeric");

    // 한글 금액은 aria-describedby로 연결되고 입력 즉시 갱신된다.
    await user.type(kbPrice, "125000");
    expect(kbPrice).toHaveValue("125,000");
    expect(kbPrice).toHaveAccessibleDescription("12억 5,000만원");

    await user.type(salePrice, "0");
    // 오류는 입력 중이 아니라 blur 시점에 뜬다.
    expect(screen.queryByText("0보다 큰 금액을 입력하세요")).not.toBeInTheDocument();

    await user.tab();
    const error = screen.getByText("0보다 큰 금액을 입력하세요");
    expect(salePrice).toHaveAttribute("aria-invalid", "true");
    expect(salePrice).toHaveAccessibleDescription(expect.stringContaining(error.textContent ?? ""));
    // 오류는 매매가 칸에만 붙는다.
    expect(salePrice.closest("div")?.parentElement).toContainElement(error);
    expect(kbPrice).toHaveAttribute("aria-invalid", "false");
    expect(kbPrice).not.toHaveAccessibleDescription(expect.stringContaining("0보다 큰"));

    // 유효하지 않은 금액이 있으면 결과 카드는 빈 상태이고 저장할 수 없다.
    expect(within(resultCard()).getByText("매매가와 KB시세를 입력하세요")).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "저장" });
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /이름/ })).not.toBeInTheDocument();
  });

  it("#3 처음 열면 규제지역·무주택이 선택돼 있고, 보유 상태 라디오 4개가 각각 대응하는 borrower로 계산된다 (AC-2)", async () => {
    const user = userEvent.setup();
    render(<MortgageCalculator />);

    expect(screen.getByRole("radio", { name: "규제지역" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "무주택" })).toBeChecked();
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(2);

    // 시나리오 1: 매매가 12억 5,000만, KB시세 12억 → 담보 기준 12억, 상한 6억(15억 이하 구간)
    await user.type(screen.getByLabelText("매매가"), "125000");
    await user.type(screen.getByLabelText("KB시세"), "120000");

    // 기본값(규제지역·무주택 40%)으로 바로 계산된다.
    expect(within(resultCard()).getByRole("heading")).toHaveTextContent("규제지역 · 무주택");
    expect(rowValue("적용 LTV")).toBe("40%");
    expect(rowValue("예상 한도")).toBe("4억 8,000만원");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("7억 7,000만원");

    const cases = [
      // 라디오 이름, 조건 요약, 적용 LTV, LTV 금액, 예상 한도, 자기자금
      [
        "무주택·생애최초",
        "규제지역 · 무주택·생애최초",
        "70%",
        "8억 4,000만원",
        "6억원",
        "6억 5,000만원",
      ],
      [
        "1주택 처분조건부",
        "규제지역 · 1주택 처분조건부",
        "40%",
        "4억 8,000만원",
        "4억 8,000만원",
        "7억 7,000만원",
      ],
      [
        "1주택 미처분(추가구입)",
        "규제지역 · 1주택 미처분(추가구입)",
        "LTV 0% · 주택구입 목적 주담대 불가",
        "0만원",
        "0만원",
        "12억 5,000만원",
      ],
      ["무주택", "규제지역 · 무주택", "40%", "4억 8,000만원", "4억 8,000만원", "7억 7,000만원"],
    ];

    for (const [radio, condition, ltv, ltvAmount, loanLimit, ownFunds] of cases) {
      await user.click(screen.getByRole("radio", { name: radio }));
      expect(screen.getByRole("radio", { name: radio })).toBeChecked();
      expect(within(resultCard()).getByRole("heading")).toHaveTextContent(condition);
      expect(rowValue("적용 LTV")).toBe(ltv);
      expect(rowValue("LTV 금액")).toBe(ltvAmount);
      expect(rowValue("예상 한도")).toBe(loanLimit);
      expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe(ownFunds);
    }

    // 소재지 선택도 계산에 전달된다: 비수도권·생애최초 80%, 상한 없음
    await user.click(screen.getByRole("radio", { name: "무주택·생애최초" }));
    await user.click(screen.getByRole("radio", { name: "비수도권" }));
    expect(within(resultCard()).getByRole("heading")).toHaveTextContent(
      "비수도권 · 무주택·생애최초",
    );
    expect(rowValue("적용 LTV")).toBe("80%");
    expect(rowValue("한도 상한")).toBe("적용 안 함");
    expect(rowValue("예상 한도")).toBe("9억 6,000만원");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("2억 9,000만원");
  });
});

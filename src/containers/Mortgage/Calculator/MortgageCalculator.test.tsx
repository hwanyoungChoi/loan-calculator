// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import AppRoutes from "@/AppRoutes";
import { LISTINGS_STORAGE_KEY } from "@/lib/utils/listingStorage";

function resultCard() {
  return screen.getByRole("region", { name: "계산 결과" });
}

/** 결과 카드에서 라벨(dt) 옆의 값(첫 dd) */
function rowValue(label: string): string {
  const term = within(resultCard()).getByText(label, { selector: "dt" });
  return term.parentElement?.querySelector("dd")?.textContent ?? "";
}

function summaryBar() {
  return screen.getByRole("region", { name: "계산 요약" });
}

/** 고정 요약 바에서 라벨(dt) 옆의 값. 결과 카드와 요약 바 모두 "—"일 수 있어 영역별로 조회한다. */
function summaryValue(label: string): string {
  const term = within(summaryBar()).getByText(label, { selector: "dt" });
  return term.parentElement?.querySelector("dd")?.textContent ?? "";
}

async function retype(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  text: string,
) {
  await user.clear(element);
  await user.type(element, text);
}

const BORROWER_RADIO_NAMES = [
  "무주택",
  "무주택·생애최초",
  "무주택·서민실수요자",
  "1주택 처분조건부",
  "1주택 미처분(추가구입)",
];
const UNVERIFIED_REQUIREMENTS = "소득·무주택세대주 요건은 확인하지 않았습니다";

describe("계산 화면 (통합)", () => {
  // draft가 localStorage에 남으므로 테스트마다 빈 저장소와 계산 화면에서 시작한다.
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/";
  });

  it("#1 매매가에 0을 입력하고 blur하면 그 필드 아래에 오류가 뜨고 저장 시트가 열리지 않는다 (AC-8b)", async () => {
    const user = userEvent.setup();
    // AC-8c: 알 수 없는 해시로 들어오면 계산 화면을 보이고 주소를 #/로 replace한다(이력이 늘지 않는다).
    window.location.hash = "#/listing/abc";
    const historyLength = window.history.length;
    render(<AppRoutes />);
    await waitFor(() => expect(window.location.hash).toBe("#/"));
    expect(window.history.length).toBe(historyLength);

    const salePrice = screen.getByLabelText("매매가");
    const kbPrice = screen.getByLabelText("KB시세");

    expect(salePrice).toHaveAttribute("inputmode", "numeric");
    expect(kbPrice).toHaveAttribute("inputmode", "numeric");

    // 한글 금액은 aria-describedby로 연결되고 입력 즉시 갱신된다.
    await user.type(kbPrice, "125000");
    expect(kbPrice).toHaveValue("125,000");
    expect(kbPrice).toHaveAccessibleDescription("12억 5,000만원");

    // 대조군: 두 금액이 유효하면 저장 버튼이 활성이고 누르면 저장 시트가 열린다.
    await user.type(salePrice, "125000");
    const barSaveButton = screen.getByRole("button", { name: "저장" });
    await user.click(barSaveButton);
    let sheet = screen.getByRole("dialog");
    // 시트가 열린 동안 뒤 화면은 inert다.
    expect(salePrice.closest("[inert]")).not.toBeNull();
    expect(barSaveButton.closest("[inert]")).not.toBeNull();
    expect(sheet.closest("[inert]")).toBeNull();

    // 이름 없이 제출하면 저장하지 않고 포커스를 이름 필드(첫 오류 필드)로 옮긴다.
    const nameInput = within(sheet).getByRole("textbox", { name: "매물 이름" });
    const submitButton = within(sheet).getByRole("button", { name: "저장" });
    await user.click(submitButton);
    expect(within(sheet).getByText("매물 이름을 입력하세요")).toBeInTheDocument();
    expect(localStorage.getItem(LISTINGS_STORAGE_KEY)).toBeNull();
    expect(nameInput).toHaveFocus();
    expect(nameInput).toHaveAttribute("aria-invalid", "true");

    // Esc는 취소다. 시트가 닫히고 포커스가 저장 버튼으로 돌아온다.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(barSaveButton).toHaveFocus();
    expect(salePrice.closest("[inert]")).toBeNull();

    await user.click(barSaveButton);
    sheet = screen.getByRole("dialog");
    await user.click(within(sheet).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(barSaveButton).toHaveFocus();

    await user.clear(salePrice);
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
    expect(screen.queryByRole("textbox", { name: "매물 이름" })).not.toBeInTheDocument();
  });

  it("#3 처음 열면 규제지역·무주택이 선택돼 있고, 보유 상태 라디오 5개가 순서대로 각각 대응하는 borrower로 계산되며, 서민·실수요자는 요건 안내와 요건 미충족(ineligible)을 보인다 (1차 AC-2, 2차 AC-1c)", async () => {
    const user = userEvent.setup();
    render(<AppRoutes />);

    expect(screen.getByRole("radio", { name: "규제지역" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "무주택" })).toBeChecked();
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(2);

    // 보유 상태 라디오는 5개이고 화면 순서가 스펙과 같다.
    const borrowerRadios = within(screen.getByRole("group", { name: "보유 상태" })).getAllByRole(
      "radio",
    );
    expect(borrowerRadios).toHaveLength(BORROWER_RADIO_NAMES.length);
    BORROWER_RADIO_NAMES.forEach((name, index) => {
      expect(borrowerRadios[index]).toHaveAccessibleName(name);
    });
    // 요건 안내는 서민·실수요자를 고를 때만 보인다.
    expect(screen.queryByText("주택가격 8억원 이하")).not.toBeInTheDocument();

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

    // 서민·실수요자(시나리오 1): 규제지역 7억 → 요건 안내 3줄, LTV 60%, 결과 카드의 "확인 안 함" 문구
    await user.click(screen.getByRole("radio", { name: "규제지역" }));
    await retype(user, screen.getByLabelText("매매가"), "70000");
    await retype(user, screen.getByLabelText("KB시세"), "70000");
    await user.click(screen.getByRole("radio", { name: "무주택·서민실수요자" }));
    expect(screen.getByRole("radio", { name: "무주택·서민실수요자" })).toBeChecked();
    expect(screen.getByText("부부합산 연소득 9,000만원 이하")).toBeInTheDocument();
    expect(screen.getByText("주택가격 8억원 이하")).toBeInTheDocument();
    expect(screen.getByText("무주택세대주")).toBeInTheDocument();
    expect(within(resultCard()).getByRole("heading")).toHaveTextContent(
      "규제지역 · 무주택·서민실수요자",
    );
    expect(within(resultCard()).getByText(UNVERIFIED_REQUIREMENTS)).toBeInTheDocument();
    expect(rowValue("적용 LTV")).toBe("60%");
    expect(rowValue("예상 한도")).toBe("4억 2,000만원");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("2억 8,000만원");
    expect(within(summaryBar()).queryByText("요건 미충족")).not.toBeInTheDocument();

    // 시나리오 2: 85000/84000 → 판정가 8억 5,000만원(매매가) 초과로 ineligible. 한도·자기자금은 정확히 "—"
    await retype(user, screen.getByLabelText("매매가"), "85000");
    await retype(user, screen.getByLabelText("KB시세"), "84000");
    expect(rowValue("적용 LTV")).toBe("요건 미충족");
    expect(rowValue("예상 한도")).toBe("—");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("—");
    expect(within(resultCard()).getByText(/주택가격 8억 5,000만원\(매매가\)/)).toBeInTheDocument();
    expect(within(resultCard()).getByText(UNVERIFIED_REQUIREMENTS)).toBeInTheDocument();
    expect(within(summaryBar()).getByText("요건 미충족")).toBeInTheDocument();
    expect(summaryValue("예상 한도")).toBe("—");
    expect(summaryValue("필요한 자기자금")).toBe("—");
    // 요건 미충족이어도 금액이 유효하면 저장할 수 있다.
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();

    // 보유 상태를 "무주택"으로 바꾸면 다시 계산되고 안내·태그가 사라진다(84000 × 40%).
    await user.click(screen.getByRole("radio", { name: "무주택" }));
    expect(rowValue("적용 LTV")).toBe("40%");
    expect(rowValue("예상 한도")).toBe("3억 3,600만원");
    expect(summaryValue("예상 한도")).toBe("3억 3,600만원");
    expect(within(summaryBar()).queryByText("요건 미충족")).not.toBeInTheDocument();
    expect(screen.queryByText("주택가격 8억원 이하")).not.toBeInTheDocument();
    expect(within(resultCard()).queryByText(UNVERIFIED_REQUIREMENTS)).not.toBeInTheDocument();
  });

  it("#6 LTV 직접 입력: 70이면 사용자 지정 LTV 70%와 규제 기준 40%를 함께 보이고, 켠 채 비우면 즉시 안내하며 저장할 수 없다. 0이면 한도 0만원, 새 계산은 직접 입력을 끈다 (AC-2d)", async () => {
    const user = userEvent.setup();
    render(<AppRoutes />);
    const salePrice = screen.getByLabelText("매매가");
    const kbPrice = screen.getByLabelText("KB시세");
    await user.type(salePrice, "100000");
    await user.type(kbPrice, "100000");

    const ltvSwitch = screen.getByRole("switch", { name: "LTV 직접 입력(은행 상담값)" });
    expect(ltvSwitch).not.toBeChecked();
    expect(screen.queryByLabelText("사용자 지정 LTV")).not.toBeInTheDocument();

    // 켠 채 비어 있으면: 입력 칸 아래 즉시 안내(blur 전), 결과 카드 빈 상태, 저장 비활성
    await user.click(ltvSwitch);
    expect(ltvSwitch).toBeChecked();
    const ltvInput = screen.getByLabelText("사용자 지정 LTV");
    expect(ltvInput).toHaveValue("");
    expect(ltvInput).toHaveAttribute("inputmode", "numeric");
    expect(ltvInput).toHaveAccessibleDescription("값을 입력하거나 직접 입력을 끄세요");
    expect(
      within(resultCard()).getByText("LTV를 입력하거나 직접 입력을 끄세요"),
    ).toBeInTheDocument();
    expect(within(resultCard()).queryByRole("heading")).not.toBeInTheDocument();
    expect(summaryValue("예상 한도")).toBe("—");
    const saveButton = screen.getByRole("button", { name: "저장" });
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 70: 결과 카드·조건 요약·요약 바에 "사용자 지정 LTV 70%", 규제 기준 40% 병기, 상한 유지(7억 → 6억), 초과 경고
    await user.type(ltvInput, "70");
    expect(ltvInput).not.toHaveAccessibleDescription(expect.stringContaining("값을 입력하거나"));
    expect(rowValue("적용 LTV")).toContain("사용자 지정 LTV 70%");
    expect(within(resultCard()).getByText("규제 기준 40%")).toBeInTheDocument();
    expect(within(resultCard()).getByText("한도 상한은 규제대로 적용")).toBeInTheDocument();
    expect(within(resultCard()).getByText(/규제 LTV보다 높습니다/)).toBeInTheDocument();
    expect(within(resultCard()).getByRole("heading")).toHaveTextContent(
      "규제지역 · 무주택 · 사용자 지정 LTV 70%",
    );
    expect(rowValue("LTV 금액")).toBe("7억원");
    expect(rowValue("예상 한도")).toBe("6억원");
    expect(within(summaryBar()).getByText("사용자 지정 LTV 70%")).toBeInTheDocument();
    expect(summaryValue("예상 한도")).toBe("6억원");
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();

    // 규제와 같은 값(40)이면 경고가 없다.
    await retype(user, ltvInput, "40");
    expect(within(resultCard()).getByText("규제 기준 40%")).toBeInTheDocument();
    expect(within(resultCard()).queryByText(/규제 LTV보다 높습니다/)).not.toBeInTheDocument();

    // 0: 한도는 "—"가 아니라 0만원, 자기자금은 매매가 전액
    await retype(user, ltvInput, "0");
    expect(rowValue("예상 한도")).toBe("0만원");
    expect(rowValue("필요한 자기자금(부대비용 제외)")).toBe("10억원");
    expect(summaryValue("예상 한도")).toBe("0만원");
    expect(within(summaryBar()).getByText("사용자 지정 LTV 0%")).toBeInTheDocument();

    // 오류는 blur 시점에 입력 칸 아래에 뜨고, 결과 카드는 빈 상태다.
    await retype(user, ltvInput, "70.5");
    await user.tab();
    expect(ltvInput).toHaveAttribute("aria-invalid", "true");
    expect(ltvInput).toHaveAccessibleDescription("정수(%)로 입력하세요");
    expect(
      within(resultCard()).getByText("LTV를 입력하거나 직접 입력을 끄세요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();

    // 서민·실수요자 + 90000/90000 + 60: 사용자 지정이 우선하고 규제 기준은 요건 미충족
    await retype(user, salePrice, "90000");
    await retype(user, kbPrice, "90000");
    await user.click(screen.getByRole("radio", { name: "무주택·서민실수요자" }));
    await retype(user, ltvInput, "60");
    expect(rowValue("적용 LTV")).toContain("사용자 지정 LTV 60%");
    expect(
      within(resultCard()).getByText("규제 기준: 서민·실수요자 요건 미충족"),
    ).toBeInTheDocument();
    expect(rowValue("예상 한도")).toBe("5억 4,000만원");
    expect(within(summaryBar()).getByText("사용자 지정 LTV 60%")).toBeInTheDocument();
    expect(within(summaryBar()).queryByText("요건 미충족")).not.toBeInTheDocument();

    // 상한 없는 지역(비수도권)이면 "한도 상한은 규제대로 적용"이 없다.
    await user.click(screen.getByRole("radio", { name: "무주택" }));
    await user.click(screen.getByRole("radio", { name: "비수도권" }));
    expect(within(resultCard()).getByText("규제 기준 70%")).toBeInTheDocument();
    expect(within(resultCard()).queryByText("한도 상한은 규제대로 적용")).not.toBeInTheDocument();
    expect(rowValue("예상 한도")).toBe("5억 4,000만원");

    // 끄면 규제 LTV로 돌아가고, 다시 켜면 입력은 빈 값이다.
    await user.click(ltvSwitch);
    expect(screen.queryByLabelText("사용자 지정 LTV")).not.toBeInTheDocument();
    expect(rowValue("적용 LTV")).toBe("70%");
    expect(within(summaryBar()).queryByText(/사용자 지정 LTV/)).not.toBeInTheDocument();
    await user.click(ltvSwitch);
    expect(screen.getByLabelText("사용자 지정 LTV")).toHaveValue("");

    // "새 계산"은 직접 입력을 끈다(소재지·보유 상태는 유지).
    await user.type(screen.getByLabelText("사용자 지정 LTV"), "70");
    expect(within(summaryBar()).getByText("사용자 지정 LTV 70%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "새 계산" }));
    expect(screen.getByRole("switch", { name: "LTV 직접 입력(은행 상담값)" })).not.toBeChecked();
    expect(screen.queryByLabelText("사용자 지정 LTV")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "비수도권" })).toBeChecked();
    await user.type(screen.getByLabelText("매매가"), "100000");
    await user.type(screen.getByLabelText("KB시세"), "100000");
    expect(rowValue("적용 LTV")).toBe("70%");
    expect(within(summaryBar()).queryByText(/사용자 지정 LTV/)).not.toBeInTheDocument();
  });
});

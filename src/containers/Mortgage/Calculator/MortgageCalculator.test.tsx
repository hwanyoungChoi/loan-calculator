// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppRoutes from "@/AppRoutes";
import { LAWD_CODES } from "@/lib/constants/lawdCodes";
import { LISTINGS_STORAGE_KEY } from "@/lib/utils/listingStorage";
import { TRADE_LOOKUP_STORAGE_KEY } from "@/lib/utils/tradeLookupStorage";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import type { AptTradesResponse } from "@/lib/types/aptTrade";

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

const GANGNAM_TRADES: AptTradesResponse = {
  lawdCd: "11680",
  months: ["202610", "202609", "202608"],
  items: [
    {
      aptName: "래미안OO",
      umdName: "대치동",
      exclusiveArea: 84.97,
      floor: 12,
      dealAmount: 115000,
      dealDate: "2026-10-03",
    },
    {
      aptName: "은마",
      umdName: "대치동",
      exclusiveArea: 76.79,
      floor: null,
      dealAmount: 98000,
      dealDate: "2026-09-21",
    },
  ],
  source: {
    name: "국토교통부 아파트 매매 실거래가",
    url: "https://www.data.go.kr/data/15126469/openapi.do",
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** 가짜 fetch가 받은 요청 URL들의 쿼리 */
function requestedQueries(fetchMock: { mock: { calls: unknown[][] } }) {
  return fetchMock.mock.calls.map(([url]) => {
    const parsed = new URL(String(url), "http://localhost");
    expect(parsed.pathname).toBe("/api/apt-trades");
    return Object.fromEntries(parsed.searchParams);
  });
}

/** 네이버부동산 공유 텍스트(가정 샘플) */
const SALE_SHARE_TEXT = [
  "[네이버 부동산]",
  "래미안OO",
  "아파트 매매 12억 5,000",
  "공급/전용 112/84㎡ · 25/35층 · 남향",
  "2015년 입주 · 101동",
  "https://new.land.naver.com/complexes/00000?articleNo=0000000000",
].join("\n");

describe("계산 화면 (통합)", () => {
  // draft가 localStorage에 남으므로 테스트마다 빈 저장소와 계산 화면에서 시작한다.
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("#1 매매가에 0을 입력하고 blur하면 그 필드 아래에 오류가 뜨고 저장 시트가 열리지 않는다 (AC-8b)", async () => {
    const user = userEvent.setup();
    // AC-8c: 알 수 없는 해시로 들어오면 계산 화면을 보이고 주소를 #/로 replace한다(이력이 늘지 않는다).
    window.location.hash = "#/listing/abc";
    const historyLength = window.history.length;
    renderWithQueryClient(<AppRoutes />);
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
    renderWithQueryClient(<AppRoutes />);

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
    renderWithQueryClient(<AppRoutes />);
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

  it("#7 실거래가 시트: 시도·시군구를 고르면 lawdCd·months=3으로 조회해 행을 보이고, 설정 오류는 다시 시도 없이 안내하며, 닫았다 열면 캐시에서 뜨고 새 계산은 단지명만 비운다 (AC-5a, AC-5b)", async () => {
    const user = userEvent.setup();
    let resolveGangnam: (response: Response) => void = () => {};
    const fetchMock = vi.fn((url: string) => {
      const lawdCd = new URL(url, "http://localhost").searchParams.get("lawdCd");
      if (lawdCd === "11680") {
        return new Promise<Response>((resolve) => {
          resolveGangnam = resolve;
        });
      }
      return Promise.resolve(
        jsonResponse({ error: "notConfigured", message: "MOLIT_SERVICE_KEY" }, 503),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithQueryClient(<AppRoutes />);

    const openButton = screen.getByRole("button", { name: "이 지역 실거래가 보기" });
    await user.click(openButton);
    let sheet = screen.getByRole("dialog", { name: "이 지역 실거래가" });
    const sigunguOf = () => within(sheet).getByLabelText<HTMLSelectElement>("시군구");
    expect(sigunguOf()).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();

    // 시도를 고르면 그 시도의 시군구만 나온다.
    await user.selectOptions(within(sheet).getByLabelText("시도"), "서울특별시");
    const seoulCodes = LAWD_CODES.filter((entry) => entry.sido === "서울특별시").map(
      (entry) => entry.code,
    );
    const optionValues = [...sigunguOf().options].map((option) => option.value).filter(Boolean);
    expect(optionValues).toEqual(seoulCodes);

    // 설정 오류(503 notConfigured): 문구가 결과 자리에 뜨고 다시 시도 버튼은 없다.
    await user.selectOptions(sigunguOf(), "11110");
    expect(
      await within(sheet).findByText("서버 설정이 끝나지 않았습니다(서비스키 미등록)"),
    ).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    expect(requestedQueries(fetchMock)).toEqual([{ lawdCd: "11110", months: "3" }]);

    // 시도를 바꾸면 시군구는 "선택" 초기값으로 돌아간다.
    await user.selectOptions(within(sheet).getByLabelText("시도"), "경기도");
    expect(sigunguOf()).toHaveValue("");

    // 시군구를 고르면 즉시 기억하고 조회한다. 로딩 표시 뒤에 행이 만원 금액으로 나온다.
    await user.selectOptions(within(sheet).getByLabelText("시도"), "서울특별시");
    await user.selectOptions(sigunguOf(), "11680");
    expect(JSON.parse(localStorage.getItem(TRADE_LOOKUP_STORAGE_KEY) ?? "null")).toEqual({
      lawdCd: "11680",
    });
    expect(
      within(sheet).getByRole("status", { name: "실거래가를 불러오는 중" }),
    ).toBeInTheDocument();
    resolveGangnam(jsonResponse(GANGNAM_TRADES));
    const rows = await within(sheet).findAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("래미안OO")).toBeInTheDocument();
    expect(within(rows[0]).getByText("11억 5,000만원")).toBeInTheDocument();
    expect(within(rows[1]).getByText("9억 8,000만원")).toBeInTheDocument();
    expect(within(sheet).getByText(/최근 3개월 · 2건/)).toBeInTheDocument();
    expect(within(sheet).getByText("참고용이며 계산에 반영하지 않습니다")).toBeInTheDocument();
    expect(requestedQueries(fetchMock).at(-1)).toEqual({ lawdCd: "11680", months: "3" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 닫았다 열면 같은 시군구가 선택돼 있고 재조회 없이 캐시에서 뜬다.
    await user.click(within(sheet).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    await user.click(openButton);
    sheet = screen.getByRole("dialog", { name: "이 지역 실거래가" });
    expect(sigunguOf()).toHaveValue("11680");
    expect(within(sheet).getAllByRole("listitem")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 단지명을 타이핑하는 동안은 요청이 나가지 않고, "조회"를 누를 때 나간다.
    const aptNameInput = within(sheet).getByLabelText("단지명(선택)");
    await user.type(aptNameInput, " 래미안 ");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    resolveGangnam = () => {};
    await user.click(within(sheet).getByRole("button", { name: "조회" }));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requestedQueries(fetchMock).at(-1)).toEqual({
      lawdCd: "11680",
      months: "3",
      aptName: "래미안",
    });

    // 새 계산 뒤: 단지명은 비고 시군구 기억은 남는다. 단지명 없는 조회는 캐시에 있어 재조회하지 않는다.
    await user.click(within(sheet).getByRole("button", { name: "닫기" }));
    await user.click(screen.getByRole("button", { name: "새 계산" }));
    await user.click(openButton);
    sheet = screen.getByRole("dialog", { name: "이 지역 실거래가" });
    expect(within(sheet).getByLabelText("단지명(선택)")).toHaveValue("");
    expect(sigunguOf()).toHaveValue("11680");
    expect(within(sheet).getAllByRole("listitem")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("#8 붙여넣기: 매매 공유 텍스트를 붙이면 미리보기에 매매가·단지·면적과 적용 안내가 보이고, 적용 전에는 입력이 그대로이며, 적용하면 매매가를 채우고 KB시세를 비워 포커스하고 직접 입력을 끄며 저장 이름을 제안한다. 링크만 붙이면 적용할 수 없다 (AC-7e)", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppRoutes />);
    const salePrice = screen.getByLabelText("매매가");
    const kbPrice = screen.getByLabelText("KB시세");
    await user.type(salePrice, "100000");
    await user.type(kbPrice, "98000");
    const ltvSwitch = screen.getByRole("switch", { name: "LTV 직접 입력(은행 상담값)" });
    await user.click(ltvSwitch);
    await user.type(screen.getByLabelText("사용자 지정 LTV"), "70");

    // 열면 textarea에 포커스, 빈 값이라 적용 비활성
    const pasteButton = screen.getByRole("button", { name: "붙여넣기로 채우기" });
    await user.click(pasteButton);
    let sheet = screen.getByRole("dialog", { name: "붙여넣기로 채우기" });
    let textarea = within(sheet).getByRole("textbox", { name: "공유 텍스트" });
    expect(textarea).toHaveFocus();
    expect(within(sheet).getByRole("button", { name: "적용" })).toBeDisabled();

    // "읽기" 버튼 없이 붙이자마자 미리보기가 뜬다.
    await user.paste(SALE_SHARE_TEXT);
    const factValue = (label: string) =>
      within(sheet).getByText(label, { selector: "dt" }).parentElement?.querySelector("dd")
        ?.textContent;
    expect(factValue("매매가")).toBe("12억 5,000만원");
    expect(factValue("단지(추정)")).toBe("래미안OO");
    expect(factValue("면적")).toBe("84㎡");
    expect(within(sheet).getByText("KB시세는 비워집니다")).toBeInTheDocument();
    expect(within(sheet).getByText("사용자 지정 LTV는 꺼집니다")).toBeInTheDocument();
    // 적용 전에는 뒤 화면 입력이 바뀌지 않는다.
    expect(salePrice).toHaveValue("100,000");
    expect(kbPrice).toHaveValue("98,000");

    await user.click(within(sheet).getByRole("button", { name: "적용" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // 적용은 입력부를 다시 그리므로 칸을 새로 찾는다.
    expect(screen.getByLabelText("매매가")).toHaveValue("125,000");
    const appliedKbPrice = screen.getByLabelText("KB시세");
    expect(appliedKbPrice).toHaveValue("");
    expect(appliedKbPrice).toHaveFocus();
    expect(screen.getByRole("switch", { name: "LTV 직접 입력(은행 상담값)" })).not.toBeChecked();
    expect(screen.queryByLabelText("사용자 지정 LTV")).not.toBeInTheDocument();

    // KB시세를 채우고 저장 시트를 열면 이름 칸에 제안 이름이 들어 있다.
    await user.type(appliedKbPrice, "120000");
    await user.click(screen.getByRole("button", { name: "저장" }));
    const saveSheet = screen.getByRole("dialog");
    expect(within(saveSheet).getByRole("textbox", { name: "매물 이름" })).toHaveValue(
      "래미안OO 84㎡",
    );
    await user.click(within(saveSheet).getByRole("button", { name: "취소" }));

    // 링크 한 줄만 붙이면 안내 문구와 적용 비활성
    await user.click(pasteButton);
    sheet = screen.getByRole("dialog", { name: "붙여넣기로 채우기" });
    textarea = within(sheet).getByRole("textbox", { name: "공유 텍스트" });
    expect(textarea).toHaveFocus();
    await user.paste("https://new.land.naver.com/complexes/00000?articleNo=0000000000");
    expect(
      within(sheet).getByText("링크는 읽지 않습니다. 앱의 공유 텍스트 전체를 붙여 넣으세요"),
    ).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(within(sheet).getByRole("button", { name: "적용" })).toBeDisabled();
  });
});

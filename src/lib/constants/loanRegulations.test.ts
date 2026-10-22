import { describe, expect, it } from "vitest";

import {
  LOAN_CAP,
  LOAN_REGULATIONS,
  LTV_TABLE,
  PREFERRED_BORROWER_REQUIREMENTS,
  REGULATION_BASE_DATE,
  REGULATION_SOURCES,
} from "./loanRegulations";

import type { Borrower, LtvCell, Region } from "@/lib/types/regulation";

// 제품 코드의 목록을 쓰지 않고 직접 적는다. 키가 빠지거나 늘면 이 테스트가 잡아야 한다.
const REGIONS: Region[] = ["regulated", "capitalNonRegulated", "nonCapital"];
const BORROWERS: Borrower[] = [
  "noHome",
  "firstHome",
  "noHomePreferred",
  "oneHomeDisposal",
  "oneHomeKeep",
];

/**
 * 스펙 "LTV 행렬"을 그대로 옮긴 기대값(무주택·생애최초·서민실수요자·처분조건부·미처분 순). null은 미확인이다.
 * 규제 파일에서 가져오지 않는다. 이 테스트는 스펙 표와 파일의 일치만 지킨다(AC-2).
 */
const EXPECTED_LTV: Record<Region, Record<Borrower, number | null>> = {
  regulated: {
    noHome: 40,
    firstHome: 70,
    noHomePreferred: 60,
    oneHomeDisposal: 40,
    oneHomeKeep: 0,
  },
  capitalNonRegulated: {
    noHome: 70,
    firstHome: 70,
    noHomePreferred: 70,
    oneHomeDisposal: 70,
    oneHomeKeep: 0,
  },
  nonCapital: {
    noHome: 70,
    firstHome: 80,
    noHomePreferred: null,
    oneHomeDisposal: 70,
    oneHomeKeep: 60,
  },
};

const COMBINATIONS = REGIONS.flatMap((region) =>
  BORROWERS.map((borrower) => [region, borrower] as const),
);

const SOURCE_URLS = REGULATION_SOURCES.map((source) => source.url);

/** 실존하는 YYYY-MM-DD인지. "2026-02-30"처럼 Date가 넘겨 버리는 날짜는 거부한다. */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** (b) 날짜 형식: 실존하는 날짜이고 기준일 이하 */
function expectDateOnOrBeforeBase(value: string) {
  expect(isRealDate(value), `실존하는 YYYY-MM-DD가 아님: ${value}`).toBe(true);
  expect(value <= REGULATION_BASE_DATE, `기준일(${REGULATION_BASE_DATE}) 이후: ${value}`).toBe(
    true,
  );
}

/** (b) 출처 형식: https URL이고 REGULATION_SOURCES 중 하나 */
function expectKnownSourceUrl(value: string) {
  expect(isHttpsUrl(value), `https URL이 아님: ${value}`).toBe(true);
  expect(SOURCE_URLS).toContain(value);
}

describe("검사 도구 자체", () => {
  it.each(["2026-10-21", "2024-02-29"])("%s는 실존 날짜", (value) => {
    expect(isRealDate(value)).toBe(true);
  });

  it.each(["2026-02-30", "2025-02-29", "2026-13-01", "2026-1-01", "2026/10/21", ""])(
    "%s는 실존 날짜가 아님",
    (value) => {
      expect(isRealDate(value)).toBe(false);
    },
  );

  it.each(["http://fsc.go.kr/x", "fsc.go.kr/x", "not a url"])("%s는 https URL이 아님", (value) => {
    expect(isHttpsUrl(value)).toBe(false);
  });
});

describe("LTV 행렬이 스펙 표와 같다 (AC-2)", () => {
  it.each(COMBINATIONS)("%s × %s", (region, borrower) => {
    expect(LTV_TABLE[region][borrower].rate).toBe(EXPECTED_LTV[region][borrower]);
  });
});

describe("규제 파일 무결성 (AC-5)", () => {
  it("(a) 소재지 3개 × 보유 상태 5개, 15개 셀이 모두 있고 다른 키는 없다", () => {
    expect(Object.keys(LTV_TABLE).sort()).toEqual([...REGIONS].sort());
    for (const region of REGIONS) {
      expect(Object.keys(LTV_TABLE[region]).sort()).toEqual([...BORROWERS].sort());
    }
    expect(COMBINATIONS).toHaveLength(15);
  });

  describe.each(COMBINATIONS)("(b) %s × %s 셀", (region, borrower) => {
    const cell: LtvCell = LTV_TABLE[region][borrower];

    it("rate가 숫자면 0~100 정수이고 출처·시행일을 함께 적었다", () => {
      if (cell.rate === null) return;
      expect(Number.isInteger(cell.rate)).toBe(true);
      expect(cell.rate).toBeGreaterThanOrEqual(0);
      expect(cell.rate).toBeLessThanOrEqual(100);
      expect(cell.sourceUrl).not.toBeNull();
      expect(cell.effectiveDate).not.toBeNull();
    });

    it("sourceUrl은 REGULATION_SOURCES에 있는 https 주소다", () => {
      if (cell.sourceUrl === null) return;
      expectKnownSourceUrl(cell.sourceUrl);
    });

    it("effectiveDate는 실존하는 YYYY-MM-DD이고 기준일 이하다", () => {
      if (cell.effectiveDate === null) return;
      expectDateOnOrBeforeBase(cell.effectiveDate);
    });
  });

  it("(c) 상한 구간은 upTo 오름차순, 마지막만 null, cap 내림차순", () => {
    const { tiers } = LOAN_CAP;
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers[tiers.length - 1].upTo).toBeNull();

    const bounded = tiers.slice(0, -1).map((tier) => tier.upTo);
    expect(bounded.every((upTo) => upTo !== null)).toBe(true);
    for (let index = 1; index < bounded.length; index += 1) {
      expect(bounded[index]).toBeGreaterThan(bounded[index - 1] as number);
    }
    for (let index = 1; index < tiers.length; index += 1) {
      expect(tiers[index].cap).toBeLessThan(tiers[index - 1].cap);
    }
  });

  it("한도 상한 구간 값은 스펙과 같다(15억 이하 6억 / 25억 이하 4억 / 초과 2억)", () => {
    expect(LOAN_CAP.tiers).toEqual([
      { upTo: 150000, cap: 60000 },
      { upTo: 250000, cap: 40000 },
      { upTo: null, cap: 20000 },
    ]);
    expect([...LOAN_CAP.regions].sort()).toEqual(["capitalNonRegulated", "regulated"]);
  });

  it("LOAN_CAP의 출처와 시행일도 (b)의 형식을 따른다", () => {
    expectKnownSourceUrl(LOAN_CAP.sourceUrl);
    expectDateOnOrBeforeBase(LOAN_CAP.effectiveDate);
  });

  it.each(REGULATION_SOURCES.map((source) => [source.id, source] as const))(
    "REGULATION_SOURCES %s의 URL·게시일·시행일 형식",
    (_id, source) => {
      expect(isHttpsUrl(source.url), `https URL이 아님: ${source.url}`).toBe(true);
      expectDateOnOrBeforeBase(source.publishedDate);
      if (source.effectiveDate !== null) expectDateOnOrBeforeBase(source.effectiveDate);
    },
  );

  it("REGULATION_BASE_DATE는 실존하는 YYYY-MM-DD다", () => {
    expect(isRealDate(REGULATION_BASE_DATE)).toBe(true);
  });

  it("LOAN_REGULATIONS는 같은 파일의 상수를 묶는다", () => {
    expect(LOAN_REGULATIONS.baseDate).toBe(REGULATION_BASE_DATE);
    expect(LOAN_REGULATIONS.preferredBorrower).toBe(PREFERRED_BORROWER_REQUIREMENTS);
    expect(LOAN_REGULATIONS.ltvTable).toBe(LTV_TABLE);
    expect(LOAN_REGULATIONS.loanCap).toBe(LOAN_CAP);
    expect(LOAN_REGULATIONS.sources).toBe(REGULATION_SOURCES);
  });
});

describe("서민·실수요자 요건 (AC-1a)", () => {
  it("요건 값은 스펙과 같다(S3 각주 5: 주택가격 8억원 이하, 부부합산 연소득 9천만원 이하, 무주택세대주)", () => {
    expect(PREFERRED_BORROWER_REQUIREMENTS).toMatchObject({
      maxHousePrice: 80000,
      maxCoupleIncome: 9000,
      householdRequirement: "무주택세대주",
      effectiveDate: "2025-10-16",
    });
  });

  it("sourceUrl은 REGULATION_SOURCES에 있는 https 주소이고, effectiveDate는 실존 날짜이며 기준일 이하다", () => {
    expectKnownSourceUrl(PREFERRED_BORROWER_REQUIREMENTS.sourceUrl);
    expectDateOnOrBeforeBase(PREFERRED_BORROWER_REQUIREMENTS.effectiveDate);
  });

  it("규제 기준일은 2026-10-22다", () => {
    expect(REGULATION_BASE_DATE).toBe("2026-10-22");
  });
});

import { LAWD_CODES } from "../../src/lib/constants/lawdCodes";

const DEFAULT_MONTHS = 3;
const APT_NAME_MAX_LENGTH = 40;
const KNOWN_LAWD_CODES: ReadonlySet<string> = new Set(LAWD_CODES.map(({ code }) => code));

export type AptTradesQuery = {
  lawdCd: string;
  months: number;
  /** trim·NFC 정규화한 값. 빈 문자열이면 필터 없음 */
  aptName: string;
};

export type ParseQueryResult = ({ ok: true } & AptTradesQuery) | { ok: false; message: string };

// message에는 파라미터 이름만 쓴다. 입력값을 되돌려 주지 않는다.
const invalid = (name: string): ParseQueryResult => ({
  ok: false,
  message: `${name} 파라미터가 올바르지 않습니다`,
});

export function parseQuery(params: URLSearchParams): ParseQueryResult {
  for (const name of ["lawdCd", "months", "aptName"]) {
    if (params.getAll(name).length > 1) return invalid(name);
  }

  const lawdCd = params.get("lawdCd");
  if (lawdCd === null || !/^\d{5}$/.test(lawdCd) || !KNOWN_LAWD_CODES.has(lawdCd)) {
    return invalid("lawdCd");
  }

  const rawMonths = params.get("months");
  if (rawMonths !== null && !/^[1-6]$/.test(rawMonths)) return invalid("months");
  const months = rawMonths === null ? DEFAULT_MONTHS : Number(rawMonths);

  const aptName = (params.get("aptName") ?? "").trim().normalize("NFC");
  if ([...aptName].length > APT_NAME_MAX_LENGTH) return invalid("aptName");

  return { ok: true, lawdCd, months, aptName };
}

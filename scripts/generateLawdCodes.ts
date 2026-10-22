/**
 * code.go.kr "법정동 코드 전체자료"(탭 구분 텍스트, CP949)에서 시군구 5자리 목록을 만든다(ADR-016).
 *
 * 사용: node scripts/generateLawdCodes.ts <전체자료.txt> <기준일 YYYY-MM-DD>
 *   1. https://www.code.go.kr/stdcode/regCodeL.do → "법정동 코드 전체자료"를 내려받아 zip을 푼다
 *   2. 위 명령을 실행하면 src/lib/constants/lawdCodes.ts를 덮어쓴다. 기준일은 zip 안 파일의 날짜다
 *   3. pnpm prettier --write src/lib/constants/lawdCodes.ts
 * 원본 파일은 커밋하지 않는다.
 *
 * 정렬: 시도는 코드 순(서울 11이 먼저, 행정 표준 순서), 시도 안의 시군구는 가나다순.
 * 규칙: 폐지되지 않은 행 중 10자리의 뒤 5자리가 00000인 행. 뒤 8자리가 0이면 시도 행이다.
 * 일반구가 있는 시(이름이 "{시 이름} "로 시작하는 다른 행이 있는 시)는 빼고 구만 둔다(가정 A7).
 * 시도 행이 없는 시군구(세종)는 sido·sigungu 모두 그 이름이다(가정 A14).
 */
import { readFileSync, writeFileSync } from "node:fs";

type Row = { code: string; name: string };
type LawdCode = { code: string; sido: string; sigungu: string };

const OUTPUT_PATH = new URL("../src/lib/constants/lawdCodes.ts", import.meta.url);
const SOURCE_URL = "https://www.code.go.kr/stdcode/regCodeL.do";

function readRows(path: string): Row[] {
  const text = new TextDecoder("euc-kr").decode(readFileSync(path));
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split("\t"))
    .filter(([code, , status]) => /^\d{10}$/.test(code ?? "") && status?.trim() === "존재")
    .map(([code, name]) => ({ code: code!, name: name!.trim().replace(/\s+/g, " ") }));
}

function toLawdCodes(rows: Row[]): LawdCode[] {
  const sigunguRows = rows.filter((row) => row.code.endsWith("00000"));
  const sidoNames = new Map(
    sigunguRows
      .filter((row) => row.code.endsWith("00000000"))
      .map((row) => [row.code.slice(0, 2), row.name]),
  );
  const candidates = sigunguRows.filter((row) => !row.code.endsWith("00000000"));
  const isCityWithDistricts = (row: Row) =>
    candidates.some((other) => other.name.startsWith(`${row.name} `));

  return candidates
    .filter((row) => !isCityWithDistricts(row))
    .map((row) => {
      const sido = sidoNames.get(row.code.slice(0, 2)) ?? row.name;
      const sigungu = row.name === sido ? sido : row.name.slice(sido.length).trim();
      return { code: row.code.slice(0, 5), sido, sigungu };
    })
    .sort(
      (a, b) =>
        a.code.slice(0, 2).localeCompare(b.code.slice(0, 2)) ||
        a.sigungu.localeCompare(b.sigungu, "ko") ||
        a.code.localeCompare(b.code),
    );
}

function render(codes: LawdCode[], baseDate: string): string {
  const items = codes
    .map(
      ({ code, sido, sigungu }) =>
        `  { code: ${JSON.stringify(code)}, sido: ${JSON.stringify(sido)}, sigungu: ${JSON.stringify(sigungu)} },`,
    )
    .join("\n");
  return `// 이 파일은 scripts/generateLawdCodes.ts가 만든다. 직접 고치지 말고 스크립트를 다시 실행한다.
// 클라이언트(시군구 select)와 서버(lawdCd 검증)가 함께 쓴다. 서버는 상대 경로로 import한다(ADR-016).

export type LawdCode = { code: string; sido: string; sigungu: string };

/** code.go.kr 법정동 코드 전체자료의 파일 기준일 */
export const LAWD_CODES_BASE_DATE = ${JSON.stringify(baseDate)};

export const LAWD_CODES_SOURCE_URL = ${JSON.stringify(SOURCE_URL)};

/** 실거래가 API의 LAWD_CD(시군구 5자리). 시도는 코드 순, 시도 안은 가나다순(select 노출 순서) */
export const LAWD_CODES: LawdCode[] = [
${items}
];
`;
}

const [inputPath, baseDate] = process.argv.slice(2);
if (inputPath === undefined || baseDate === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
  throw new Error("사용: node scripts/generateLawdCodes.ts <전체자료.txt> <YYYY-MM-DD>");
}
const codes = toLawdCodes(readRows(inputPath));
writeFileSync(OUTPUT_PATH, render(codes, baseDate));
process.stdout.write(`${codes.length}개 시군구를 썼습니다\n`);

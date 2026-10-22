/* eslint-disable no-console -- CLI 스크립트 */
/**
 * 태스크 2-3 남은 확인: 국토교통부 실거래가 기본 API의 실제 응답을 지역별로 본다.
 * (numOfRows 상한, 일반구 시의 시 코드 조회 여부(A7), 신설 구, 응답 크기와 JSON.parse 시간)
 *
 * 사용: node scripts/probeUpstream.ts [추가 LAWD_CD ...]   (예: 동탄구 코드를 인자로 준다)
 *   - 키는 환경변수 MOLIT_SERVICE_KEY, 없으면 프로젝트 루트 .dev.vars에서 읽는다(Decoding 키).
 *   - 원문 응답은 키를 지운 뒤 .wrangler/probe/{이름}.json에 저장한다(git 제외 경로).
 *   - 요청 URL과 키는 출력하지 않는다. 호출 수는 5 + 추가 코드 수(일일 한도 10,000).
 * real fixture로 옮길 때는 작은 응답만 고르고, 키가 없는지 grep으로 확인한다.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { buildUpstreamUrl } from "../server/aptTrades/buildUpstreamUrl.ts";

const OUT_DIR = new URL("../.wrangler/probe/", import.meta.url);

function readServiceKey(): string {
  const fromEnv = process.env.MOLIT_SERVICE_KEY?.trim();
  if (fromEnv) return fromEnv;
  const devVars = new URL("../.dev.vars", import.meta.url);
  if (!existsSync(devVars)) return "";
  const line = readFileSync(devVars, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("MOLIT_SERVICE_KEY="));
  return line?.slice("MOLIT_SERVICE_KEY=".length).trim() ?? "";
}

/** 지난달(KST). 이번 달은 신고 기한 30일 때문에 일부만 있다 */
function lastMonthKst(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const date = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() - 1, 1));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

type Probe = { name: string; lawdCd: string; numOfRows?: string };

const serviceKey = readServiceKey();
if (!serviceKey) {
  console.error("MOLIT_SERVICE_KEY가 없습니다(.dev.vars 또는 환경변수).");
  process.exit(1);
}
if (serviceKey.includes("%")) {
  console.error("키에 %가 있습니다. Encoding 키 대신 Decoding 키를 쓰세요(가정 A9).");
  process.exit(1);
}

const month = lastMonthKst();
const probes: Probe[] = [
  { name: "gangnam", lawdCd: "11680" },
  { name: "gangnam-rows-5000", lawdCd: "11680", numOfRows: "5000" },
  { name: "suwon-city-41110", lawdCd: "41110" },
  { name: "suwon-jangan-41111", lawdCd: "41111" },
  { name: "hwaseong-city-41590", lawdCd: "41590" },
  ...process.argv.slice(2).map((lawdCd) => ({ name: `extra-${lawdCd}`, lawdCd })),
];

const KEY_FORMS = [
  serviceKey,
  encodeURIComponent(serviceKey),
  new URLSearchParams({ k: serviceKey }).toString().slice(2),
];
const scrub = (text: string) =>
  KEY_FORMS.reduce((acc, form) => acc.replaceAll(form, "<SERVICE_KEY>"), text);

mkdirSync(OUT_DIR, { recursive: true });
console.log(`DEAL_YMD: ${month}`);

for (const probe of probes) {
  const url = new URL(
    buildUpstreamUrl({ serviceKey, lawdCd: probe.lawdCd, dealYmd: month, pageNo: 1 }),
  );
  if (probe.numOfRows) url.searchParams.set("numOfRows", probe.numOfRows);

  let status: number | string;
  let body = "";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    status = response.status;
    body = await response.text();
  } catch (error) {
    status = error instanceof Error ? error.name : "error";
  }
  writeFileSync(new URL(`${probe.name}.json`, OUT_DIR), scrub(body));

  const started = performance.now();
  let document: unknown = null;
  try {
    document = JSON.parse(body);
  } catch {
    // XML 게이트웨이 오류 등. 아래 firstChar와 원문 파일로 본다
  }
  const parseMs = performance.now() - started;

  const response = (
    document as { response?: { header?: { resultCode?: string }; body?: Record<string, unknown> } }
  )?.response;
  const items = (response?.body?.items as { item?: unknown } | undefined)?.item;
  const rows = Array.isArray(items) ? items : items ? [items] : [];
  const cdealTypes = [
    ...new Set(rows.map((row) => JSON.stringify((row as { cdealType?: unknown }).cdealType))),
  ];

  console.log(`\n## ${probe.name} (LAWD_CD ${probe.lawdCd})`);
  console.log({
    status,
    bytes: body.length,
    firstChar: body.trimStart().slice(0, 1),
    resultCode: response?.header?.resultCode ?? null,
    gatewayCode:
      body
        .match(/"returnReasonCode"\s*:\s*"(\d+)"|<returnReasonCode>(\d+)</)
        ?.slice(1)
        .find(Boolean) ?? null,
    totalCount: response?.body?.totalCount ?? null,
    numOfRows: response?.body?.numOfRows ?? null,
    rows: rows.length,
    cdealTypes,
    parseMs: Number(parseMs.toFixed(2)),
  });
}
console.log(`\n원문: ${OUT_DIR.pathname}`);

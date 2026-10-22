import type { AptTrade } from "../../src/lib/types/aptTrade";

export type ParseTradesResult =
  | {
      ok: true;
      /** 해제 거래를 뺀 거래 */
      items: AptTrade[];
      /** 이 페이지의 행 수(해제 거래 포함). 페이지 순회 종료 판정에 쓴다 */
      rowCount: number;
      /** 업스트림 totalCount */
      upstreamTotal: number;
    }
  | {
      ok: false;
      /** 업스트림 오류 코드. 코드를 읽을 수 없는 본문(빈 본문·HTML·필드 누락)이면 null */
      code: string | null;
    };

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** JSON 값은 숫자(dealDay 28)이거나 공백이 붙은 문자열(" ", "236,500")로 온다. trim한 문자열로 맞춘다 */
const text = (value: unknown): string | null =>
  typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : null;

const readCode = (value: unknown): string | null => {
  const code = text(value);
  return code !== null && /^\d{1,3}$/.test(code) ? code : null;
};

const SUCCESS_CODE = "000";
const FAILED: ParseTradesResult = { ok: false, code: null };

/**
 * 실거래가 응답 본문(`_type=json`) 하나를 읽는다. 정상 형식(`response.header.resultCode`)과
 * 게이트웨이 오류 형식(`OpenAPI_ServiceResponse.cmmMsgHeader.returnReasonCode`)을 모두 받는다.
 * 게이트웨이가 JSON 요청에도 XML로 답하는 경우에 대비해, `<`로 시작하면 오류 코드만 읽는다.
 */
export function parseTradesResponse(body: string): ParseTradesResult {
  const trimmed = body.trim();
  if (trimmed.startsWith("<")) {
    const code = readCode(trimmed.match(/<(?:returnReasonCode|resultCode)>([^<]*)</)?.[1]);
    return code === null || code === SUCCESS_CODE ? FAILED : { ok: false, code };
  }

  let document: unknown;
  try {
    document = JSON.parse(trimmed);
  } catch {
    return FAILED;
  }
  if (!isObject(document)) return FAILED;

  const gateway = document.OpenAPI_ServiceResponse;
  if (isObject(gateway)) {
    return {
      ok: false,
      code: isObject(gateway.cmmMsgHeader) ? readCode(gateway.cmmMsgHeader.returnReasonCode) : null,
    };
  }

  const response = document.response;
  if (!isObject(response) || !isObject(response.header)) return FAILED;

  const resultCode = readCode(response.header.resultCode);
  if (resultCode === null) return FAILED;
  if (resultCode !== SUCCESS_CODE) return { ok: false, code: resultCode };

  return parseBody(response.body);
}

function parseBody(body: unknown): ParseTradesResult {
  if (!isObject(body)) return FAILED;

  const upstreamTotal = body.totalCount;
  if (typeof upstreamTotal !== "number" || !Number.isInteger(upstreamTotal) || upstreamTotal < 0) {
    return FAILED;
  }

  // 0건은 items: "", 1건은 item 객체, 여러 건은 item 배열로 온다
  const item = isObject(body.items) ? body.items.item : body.items === "" ? [] : undefined;
  const rows = isObject(item) ? [item] : item;
  if (!Array.isArray(rows)) return FAILED;

  const items: AptTrade[] = [];
  for (const row of rows) {
    if (!isObject(row)) return FAILED;
    if (text(row.cdealType)) continue; // 해제 거래. 필드가 없거나 비어 있으면 정상 거래다
    const trade = toAptTrade(row);
    if (trade === null) return FAILED;
    items.push(trade);
  }
  return { ok: true, items, rowCount: rows.length, upstreamTotal };
}

function toAptTrade(row: JsonObject): AptTrade | null {
  const aptName = text(row.aptNm);
  const area = text(row.excluUseAr);
  const amount = text(row.dealAmount)?.replaceAll(",", "") ?? null;
  const year = text(row.dealYear);
  const month = text(row.dealMonth);
  const day = text(row.dealDay);
  const floor = text(row.floor) || null;

  if (
    !aptName ||
    area === null ||
    !/^\d+(\.\d+)?$/.test(area) ||
    amount === null ||
    !/^\d+$/.test(amount) ||
    year === null ||
    !/^\d{4}$/.test(year) ||
    month === null ||
    !/^\d{1,2}$/.test(month) ||
    day === null ||
    !/^\d{1,2}$/.test(day) ||
    (floor !== null && !/^-?\d+$/.test(floor))
  ) {
    return null;
  }

  return {
    aptName,
    umdName: text(row.umdNm) || null,
    exclusiveArea: Number(area),
    floor: floor === null ? null : Number(floor),
    dealAmount: Number(amount),
    dealDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
  };
}

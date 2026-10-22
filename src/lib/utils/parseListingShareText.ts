import { findFirstKoreanPrice, normalizeSpaces } from "./parseKoreanPrice";
import { countChars, LISTING_NAME_MAX_LENGTH } from "./validateListingName";

export type ParsedShareText = {
  ok: true;
  /** 만원 */
  salePrice: number;
  /** 최선 추정이다. 틀릴 수 있어 미리보기로 보여 주고 사용자가 확인한다. */
  complexName: string | null;
  /** 원문 표기 그대로(예 "84㎡", "34평"). 평→㎡ 환산하지 않는다. */
  areaText: string | null;
  /** 단지명 + 면적을 LISTING_NAME_MAX_LENGTH(코드포인트)로 자른 것. 둘 다 없으면 "" */
  suggestedName: string;
};

/** linkOnly: URL만 붙여 넣음. 링크는 가져오지 않는다(ADR-019). */
export type ShareTextFailureReason = "empty" | "linkOnly" | "notSale" | "priceNotFound";

export type ShareTextParseResult = ParsedShareText | { ok: false; reason: ShareTextFailureReason };

const URL_PATTERN = /https?:\/\/\S+/g;
const HAS_URL_PATTERN = /https?:\/\//;
const SALE_KEYWORD = "매매";
const RENT_PATTERN = /전세|월세/;
const DEAL_PATTERN = /매매|전세|월세/;
/** 공급/전용 쌍("112/84㎡")이면 뒤의 전용면적을 쓴다. */
const AREA_PATTERN = /(?<![\d.])(?:\d+(?:\.\d+)?\s*\/\s*)?(\d+(?:\.\d+)?)\s*(㎡|m²|m2|평)/;
const FLOOR_PATTERN = /\d+\s*층|[고중저]층/;
const LETTER_PATTERN = /[가-힣A-Za-z]/;
/** 앱 이름 줄("[네이버 부동산]")은 단지명이 아니다. */
const SERVICE_NAME_PATTERN = /네이버/;
/** 단지명은 짧다. 실거래가 단지명 필터의 서버 한도(40자)를 넘는 줄은 설명문으로 본다. */
const COMPLEX_NAME_MAX_LENGTH = 40;

function findAreaText(text: string): string | null {
  const exclusiveIndex = text.indexOf("전용");
  const match =
    (exclusiveIndex === -1 ? null : AREA_PATTERN.exec(text.slice(exclusiveIndex))) ??
    AREA_PATTERN.exec(text);
  return match === null ? null : `${match[1]}${match[2]}`;
}

function isComplexNameLine(line: string): boolean {
  return (
    line !== "" &&
    countChars(line) <= COMPLEX_NAME_MAX_LENGTH &&
    LETTER_PATTERN.test(line) &&
    !HAS_URL_PATTERN.test(line) &&
    !SERVICE_NAME_PATTERN.test(line) &&
    !DEAL_PATTERN.test(line) &&
    !FLOOR_PATTERN.test(line) &&
    !AREA_PATTERN.test(line) &&
    findFirstKoreanPrice(line) === null
  );
}

/**
 * 단지명 추정: URL·매매·금액·면적·층 토큰이 없는 첫 줄. 실제 공유 텍스트 형식을 확인하지 못해(가정 A10)
 * 줄 순서가 아니라 "무엇이 없는 줄인가"로 고른다.
 */
function findComplexName(text: string): string | null {
  const lines = text.split("\n").map((line) => line.trim());
  return lines.find(isComplexNameLine) ?? null;
}

function suggestName(complexName: string | null, areaText: string | null): string {
  const name = [complexName, areaText].filter((part) => part !== null).join(" ");
  return Array.from(name).slice(0, LISTING_NAME_MAX_LENGTH).join("").trim();
}

/**
 * 네이버부동산 공유 텍스트 → 매매가(만원)·단지명·면적. 줄 순서에 기대지 않고 키워드와 금액 패턴으로 찾는다.
 * 매매가는 "매매" 뒤 첫 금액이다. "매매" 없이 전세·월세만 있으면 notSale이다.
 */
export function parseListingShareText(text: string): ShareTextParseResult {
  const normalized = normalizeSpaces(text).replace(/\r\n?/g, "\n");
  if (normalized.trim() === "") return { ok: false, reason: "empty" };

  const withoutUrls = normalized.replace(URL_PATTERN, " ");
  if (withoutUrls.trim() === "") return { ok: false, reason: "linkOnly" };
  const saleIndex = withoutUrls.indexOf(SALE_KEYWORD);
  if (saleIndex === -1) {
    return { ok: false, reason: RENT_PATTERN.test(withoutUrls) ? "notSale" : "priceNotFound" };
  }
  const salePrice = findFirstKoreanPrice(withoutUrls.slice(saleIndex + SALE_KEYWORD.length));
  if (salePrice === null) return { ok: false, reason: "priceNotFound" };

  const complexName = findComplexName(normalized);
  const areaText = findAreaText(withoutUrls);
  return {
    ok: true,
    salePrice,
    complexName,
    areaText,
    suggestedName: suggestName(complexName, areaText),
  };
}

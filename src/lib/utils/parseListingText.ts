import { findFirstKoreanPrice, normalizeSpaces } from "./parseKoreanPrice";
import { countChars, truncateListingName } from "./validateListingName";

export type ParsedListingText = {
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

export type ListingTextFailureReason = "empty" | "notSale" | "priceNotFound";

export type ListingTextParseResult =
  ParsedListingText | { ok: false; reason: ListingTextFailureReason };

/**
 * OCR은 글자 사이에 공백을 자주 끼운다(가정 A4). 숫자와 금액 단위 사이("12 억", "5 천"), 거래 키워드 글자 사이("매 매")만 붙인다.
 * 0/O, ","/"." 같은 오인식은 고치지 않는다. 추측 보정이 틀린 금액을 만들 수 있어서다.
 */
const SPACED_PRICE_UNIT_PATTERN = /(\d)[ \t]+(억|천|만)/g;
const SPACED_DEAL_KEYWORD_PATTERN = /매[ \t]+매|[전월][ \t]+세/g;
const LINE_SPACES_PATTERN = /[ \t]+/g;

const SALE_KEYWORD = "매매";
const RENT_PATTERN = /전세|월세/;
const DEAL_PATTERN = /매매|전세|월세/;
/** 공급/전용 쌍("112/84㎡", "112.39㎡/84.97㎡")이면 뒤의 전용면적을 쓴다. */
const AREA_PATTERN =
  /(?<![\d.])(?:\d+(?:\.\d+)?\s*(?:㎡|m²|m2|평)?\s*\/\s*)?(\d+(?:\.\d+)?)\s*(㎡|m²|m2|평)/;
const FLOOR_PATTERN = /\d+\s*층|[고중저]층/;
/** 상태 표시줄("9:41 al LTE")처럼 한글이 없는 줄은 단지명이 아니다. */
const HANGUL_PATTERN = /[가-힣]/;
/** 앱 이름 줄("[네이버 부동산]")은 단지명이 아니다. */
const SERVICE_NAME_PATTERN = /네이버/;
/** 줄 앞뒤의 화면 기호("<", "‹", "@"). 단지명에 붙는 괄호("OO(1차)")는 남긴다. */
const EDGE_SYMBOL_PATTERN = /^[^\p{L}\p{N}(]+|[^\p{L}\p{N})]+$/gu;
/** 단지명 뒤의 동 번호("래미안OO 101동"). 남으면 실거래가 단지명 필터가 0건이 된다. */
const BUILDING_NUMBER_PATTERN = /\s*\d+동$/;
/** 단지명은 짧다. 실거래가 단지명 필터의 서버 한도(40자)를 넘는 줄은 설명문으로 본다. */
const COMPLEX_NAME_MAX_LENGTH = 40;

function normalizeOcrText(text: string): string {
  return normalizeSpaces(text)
    .replace(/\r\n?/g, "\n")
    .replace(SPACED_PRICE_UNIT_PATTERN, "$1$2")
    .replace(SPACED_DEAL_KEYWORD_PATTERN, (keyword) => keyword.replace(LINE_SPACES_PATTERN, ""));
}

function findAreaText(text: string): string | null {
  const exclusiveIndex = text.indexOf("전용");
  const match =
    (exclusiveIndex === -1 ? null : AREA_PATTERN.exec(text.slice(exclusiveIndex))) ??
    AREA_PATTERN.exec(text);
  return match === null ? null : `${match[1]}${match[2]}`;
}

function stripEdgeSymbols(line: string): string {
  return line.replace(EDGE_SYMBOL_PATTERN, "");
}

/** "< 래미안OO 101동" → "래미안OO" */
function toComplexNameCandidate(line: string): string {
  return stripEdgeSymbols(stripEdgeSymbols(line.trim()).replace(BUILDING_NUMBER_PATTERN, ""));
}

function isComplexName(candidate: string): boolean {
  return (
    candidate !== "" &&
    countChars(candidate) <= COMPLEX_NAME_MAX_LENGTH &&
    HANGUL_PATTERN.test(candidate) &&
    !SERVICE_NAME_PATTERN.test(candidate) &&
    !DEAL_PATTERN.test(candidate) &&
    !FLOOR_PATTERN.test(candidate) &&
    !AREA_PATTERN.test(candidate) &&
    findFirstKoreanPrice(candidate) === null
  );
}

/**
 * 단지명 추정: 한글이 있고 매매·금액·면적·층 토큰이 없는 첫 줄. 화면 배치를 확인하지 못해(U5)
 * 줄 순서가 아니라 "무엇이 없는 줄인가"로 고른다.
 */
function findComplexName(text: string): string | null {
  return text.split("\n").map(toComplexNameCandidate).find(isComplexName) ?? null;
}

function suggestName(complexName: string | null, areaText: string | null): string {
  const name = [complexName, areaText].filter((part) => part !== null).join(" ");
  return truncateListingName(name);
}

/**
 * 매물 화면에서 읽은 텍스트(OCR) → 매매가(만원)·단지명·면적. 줄 순서에 기대지 않고 키워드와 금액 패턴으로 찾는다.
 * 매매가는 "매매" 뒤 첫 금액이다. "매매" 없이 전세·월세만 있으면 notSale이다.
 */
export function parseListingText(text: string): ListingTextParseResult {
  const normalized = normalizeOcrText(text);
  if (normalized.trim() === "") return { ok: false, reason: "empty" };

  const saleIndex = normalized.indexOf(SALE_KEYWORD);
  if (saleIndex === -1) {
    return { ok: false, reason: RENT_PATTERN.test(normalized) ? "notSale" : "priceNotFound" };
  }
  const salePrice = findFirstKoreanPrice(normalized.slice(saleIndex + SALE_KEYWORD.length));
  if (salePrice === null) return { ok: false, reason: "priceNotFound" };

  const complexName = findComplexName(normalized);
  const areaText = findAreaText(normalized);
  return {
    ok: true,
    salePrice,
    complexName,
    areaText,
    suggestedName: suggestName(complexName, areaText),
  };
}

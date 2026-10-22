import { MAX_AMOUNT } from "./amount";

/** iOS 붙여넣기에 흔한 NBSP·제로폭 문자를 일반 공백으로 읽는다. */
const UNUSUAL_SPACE_PATTERN = /[\u00A0\u200B-\u200D\u2060\uFEFF]/g;

export function normalizeSpaces(text: string): string {
  return text.replace(UNUSUAL_SPACE_PATTERN, " ");
}

/**
 * 단위 없이 끝난 숫자 뒤에 오면 금액이 아니다: 더 이어지는 숫자, 면적(㎡·평), 층·동·호·연도, 원 단위, 공급/전용 쌍.
 * "12억 84㎡"는 84를 버리고 12억만 읽는다.
 */
const NOT_UNIT_AFTER = String.raw`(?![\d,./]|\s*(?:㎡|m²|m2|평)|[층동호년원%])`;
const COMMA_NUMBER = String.raw`\d{1,3}(?:,\d{3})+`;

/**
 * 금액 한 덩어리(만원). 맨 숫자("12", "5000")는 단위가 없어 금액으로 읽지 않는다. 쉼표가 있는 수("8,500")는 만원으로 읽는다.
 * - 억 + 만: "12억", "12억원", "12억 5,000", "12억5000만원", "12억 5천", "99,999억 9,999만원"
 * - 만: "8,500", "125,000만원", "5000만원", "5천만원"
 * 소수("12.5억")는 앞 숫자에 붙은 "."가 있어 읽지 않는다.
 */
const PRICE_SOURCE = [
  String.raw`(?<![\d,.])`,
  "(?:",
  String.raw`(?<eok>${COMMA_NUMBER}|\d+)억`,
  String.raw`(?:\s*(?:(?<eokCheon>\d)천|(?<eokMan>\d,\d{3}|\d{1,4}))(?:\s*만원?|${NOT_UNIT_AFTER})|원)?`,
  String.raw`|(?<manComma>${COMMA_NUMBER})(?:\s*만원?|${NOT_UNIT_AFTER})`,
  String.raw`|(?<man>\d+)\s*만원?`,
  String.raw`|(?<cheon>\d)천\s*만원?`,
  ")",
].join("");

const WHOLE_PRICE_PATTERN = new RegExp(`^${PRICE_SOURCE}$`);
const PRICE_PATTERN = new RegExp(PRICE_SOURCE, "g");

type PriceGroups = Partial<
  Record<"eok" | "eokMan" | "eokCheon" | "manComma" | "man" | "cheon", string>
>;

function toNumber(digits: string | undefined): number {
  return digits === undefined ? 0 : Number(digits.replaceAll(",", ""));
}

/** 1 ~ MAX_AMOUNT 만원만 금액이다("0억", "100,000억"은 아님). */
function amountOf(groups: PriceGroups): number | null {
  const amount =
    toNumber(groups.eok) * 10000 +
    toNumber(groups.eokMan) +
    toNumber(groups.eokCheon) * 1000 +
    toNumber(groups.manComma) +
    toNumber(groups.man) +
    toNumber(groups.cheon) * 1000;
  return amount >= 1 && amount <= MAX_AMOUNT ? amount : null;
}

/** 한국어 금액 표기 하나 → 만원. 금액 표기가 아니면 null */
export function parseKoreanPrice(text: string): number | null {
  const match = WHOLE_PRICE_PATTERN.exec(normalizeSpaces(text).trim());
  return match === null ? null : amountOf(match.groups ?? {});
}

/** 텍스트에서 처음 나오는 금액(만원). 층·면적·맨 숫자는 건너뛴다. */
export function findFirstKoreanPrice(text: string): number | null {
  for (const match of normalizeSpaces(text).matchAll(PRICE_PATTERN)) {
    const amount = amountOf(match.groups ?? {});
    if (amount !== null) return amount;
  }
  return null;
}

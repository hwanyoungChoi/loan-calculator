const DIGITS_PATTERN = /^\d+$/;

/** 입력칸에 보여줄 문자열. 숫자만 있으면 천 단위 쉼표를 넣고, 틀린 입력은 그대로 보여준다. */
export function toAmountInputText(raw: string): string {
  if (!DIGITS_PATTERN.test(raw)) return raw;
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 쉼표를 뺀 글자 수. 쉼표가 다시 그려져도 커서를 같은 글자 뒤에 두기 위해 센다. */
export function countNonCommaChars(text: string): number {
  return text.replaceAll(",", "").length;
}

/** 쉼표가 아닌 글자 `count`개 바로 뒤의 위치 */
export function caretAfterNonCommaChars(text: string, count: number): number {
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (seen === count) return index;
    if (text[index] !== ",") seen += 1;
  }
  return text.length;
}

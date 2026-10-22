import { toLoanInput } from "@/lib/utils/toLoanInput";

import type { Draft } from "@/lib/types/draft";

export const EMPTY_RESULT_MESSAGES = {
  amounts: "매매가와 KB시세를 입력하세요",
  customLtv: "LTV를 입력하거나 직접 입력을 끄세요",
};

/**
 * 계산 입력을 만들 수 없을 때(`toLoanInput`이 null) 결과 카드에 보일 안내.
 * 금액이 먼저다. 금액이 갖춰졌는데도 못 만들면 켜 둔 LTV 직접 입력이 비었거나 틀린 것이다.
 */
export function describeEmptyResult(draft: Draft): string {
  return toLoanInput({ ...draft, customLtv: null }) === null
    ? EMPTY_RESULT_MESSAGES.amounts
    : EMPTY_RESULT_MESSAGES.customLtv;
}

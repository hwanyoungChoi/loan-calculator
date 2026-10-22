import { validateAmount } from "./amount";
import { validateLtvRate } from "./validateLtvRate";

import type { Draft } from "@/lib/types/draft";
import type { LoanInput } from "@/lib/types/loan";

/**
 * 두 금액이 모두 유효하고, 사용자 지정 LTV(칩 값이나 직접 입력)가 있으면 그 값도 유효할 때만 계산 입력을 만든다.
 * 하나라도 비었거나 틀리면 null(결과 카드 빈 상태). 사용자 지정 값은 유효할 때만 키를 넣는다(ADR-012).
 * 85㎡ 초과는 켜졌을 때만 키를 넣는다(ADR-022).
 */
export function toLoanInput(draft: Draft): LoanInput | null {
  const salePrice = validateAmount(draft.salePrice);
  const kbPrice = validateAmount(draft.kbPrice);
  if (salePrice.status !== "valid" || kbPrice.status !== "valid") return null;
  const input: LoanInput = {
    salePrice: salePrice.value,
    kbPrice: kbPrice.value,
    region: draft.region,
    borrower: draft.borrower,
    ...(draft.isAreaOver85 && { isAreaOver85: true }),
  };
  if (draft.customLtv === null) return input;
  const customLtv = validateLtvRate(draft.customLtv);
  return customLtv.status === "valid" ? { ...input, customLtvRate: customLtv.value } : null;
}

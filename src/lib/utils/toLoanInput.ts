import { validateAmount } from "./amount";

import type { Draft } from "@/lib/types/draft";
import type { LoanInput } from "@/lib/types/loan";

/** 두 금액이 모두 유효할 때만 계산 입력을 만든다. 하나라도 비었거나 틀리면 null(결과 카드 빈 상태). */
export function toLoanInput(draft: Draft): LoanInput | null {
  const salePrice = validateAmount(draft.salePrice);
  const kbPrice = validateAmount(draft.kbPrice);
  if (salePrice.status !== "valid" || kbPrice.status !== "valid") return null;
  return {
    salePrice: salePrice.value,
    kbPrice: kbPrice.value,
    region: draft.region,
    borrower: draft.borrower,
  };
}

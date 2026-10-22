import { LTV_PRESETS } from "@/lib/constants/draft";
import { validateAmount } from "@/lib/utils/amount";
import { evaluateRegulation } from "@/lib/utils/calculateLoan";
import { isOneOf } from "@/lib/utils/isOneOf";

import type { Draft } from "@/lib/types/draft";
import type { RegulationOutcome } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

/** LTV 칩. 40·70·80은 그 값의 사용자 지정, custom은 직접 입력, regulation은 사용자 지정 없음(규제 LTV) */
export type LtvChoice = (typeof LTV_PRESETS)[number] | "custom" | "regulation";

export const LTV_CHOICES: LtvChoice[] = [...LTV_PRESETS, "custom", "regulation"];

/** draft가 가리키는 칩. 칩 값이 아닌 사용자 지정은 직접 입력이다. */
export function ltvChoiceOf(draft: Pick<Draft, "customLtv" | "isCustomLtvInput">): LtvChoice {
  if (draft.customLtv === null) return "regulation";
  if (draft.isCustomLtvInput || !isOneOf(LTV_PRESETS, draft.customLtv)) return "custom";
  return draft.customLtv;
}

/** 칩을 고를 때 draft에 넣을 값. 직접 입력은 넘긴 값(지금 값이나 기본값)으로 시작해 고쳐 쓰게 한다. */
export function ltvChoicePatch(
  choice: LtvChoice,
  customLtv: string,
): Pick<Draft, "customLtv" | "isCustomLtvInput"> {
  if (choice === "regulation") return { customLtv: null, isCustomLtvInput: false };
  if (choice === "custom") return { customLtv, isCustomLtvInput: true };
  return { customLtv: choice, isCustomLtvInput: false };
}

const NOT_CALCULATED_LABELS: Record<Exclude<RegulationOutcome["status"], "ok">, string> = {
  unconfirmed: "미확인",
  ineligible: "요건 미충족",
};

/**
 * [규제대로] 칩의 괄호 값: 지금 소재지·보유 상태의 규제 LTV. 금액이 갖춰지면 결과 카드와 같은 판정(요건 미충족 포함)을 쓰고,
 * 아직이면 규제 표의 값만 본다.
 */
export function describeRegulationChoice(draft: Draft, regulations: Regulations): string {
  const salePrice = validateAmount(draft.salePrice);
  const kbPrice = validateAmount(draft.kbPrice);
  const { rate } = regulations.ltvTable[draft.region][draft.borrower];
  const outcome: RegulationOutcome =
    salePrice.status === "valid" && kbPrice.status === "valid"
      ? evaluateRegulation(
          {
            salePrice: salePrice.value,
            kbPrice: kbPrice.value,
            region: draft.region,
            borrower: draft.borrower,
          },
          regulations,
        )
      : rate === null
        ? { status: "unconfirmed" }
        : { status: "ok", rate };
  const value =
    outcome.status === "ok" ? `${outcome.rate}%` : NOT_CALCULATED_LABELS[outcome.status];
  return `규제대로(${value})`;
}

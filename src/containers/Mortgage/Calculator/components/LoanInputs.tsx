import { Fragment, useState, type ReactNode } from "react";

import ChoiceGroup from "@/components/ChoiceGroup";
import { BORROWER_LABELS, BORROWERS, REGION_LABELS, REGIONS } from "@/lib/constants/loanConditions";
import { validateAmount } from "@/lib/utils/amount";

import AmountInput from "./AmountInput";
import CustomLtvField from "./CustomLtvField";
import styles from "./LoanInputs.module.css";
import PreferredRequirements from "./PreferredRequirements";

import type { Draft } from "@/lib/types/draft";
import type { Regulations } from "@/lib/types/regulation";

type AmountField = "salePrice" | "kbPrice";

type LoanInputsProps = {
  draft: Draft;
  regulations: Regulations;
  onChange: (patch: Partial<Draft>) => void;
};

/**
 * 가운뎃점 뒤에서 줄을 바꿀 수 있게 한다. "무주택·서민실수요자"는 360px 칩 한 칸에 다 들어가지 않는데,
 * `word-break: keep-all`이라 아무 데서나 끊기면 "무주택·서민실수요 / 자"가 된다.
 */
function allowBreakAfterDot(label: string): ReactNode {
  return label.split("·").map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          ·<wbr />
        </>
      )}
      {part}
    </Fragment>
  ));
}

const REGION_OPTIONS = REGIONS.map((value) => ({ value, label: REGION_LABELS[value] }));
const BORROWER_OPTIONS = BORROWERS.map((value) => ({
  value,
  label: allowBreakAfterDot(BORROWER_LABELS[value]),
}));

const NO_ERRORS: Record<AmountField, string | null> = { salePrice: null, kbPrice: null };

/** 붙여넣기 적용 뒤 직접 입력할 칸이라 계산 화면이 이 id로 포커스를 옮긴다. */
export const KB_PRICE_INPUT_ID = "kbPrice";

function amountErrorOf(raw: string): string | null {
  const validation = validateAmount(raw);
  return validation.status === "error" ? validation.message : null;
}

/** 계산 입력부: 금액 2개, 소재지, 보유 상태(서민·실수요자 요건 안내), LTV 직접 입력 */
function LoanInputs({ draft, regulations, onChange }: LoanInputsProps) {
  const [amountErrors, setAmountErrors] = useState(NO_ERRORS);

  // 오류는 blur에서 띄우고, 고쳐지면 입력 중에도 바로 걷는다.
  const handleAmountChange = (field: AmountField, raw: string) => {
    onChange({ [field]: raw });
    if (amountErrorOf(raw) === null) setAmountErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountBlur = (field: AmountField) => {
    setAmountErrors((prev) => ({ ...prev, [field]: amountErrorOf(draft[field]) }));
  };

  return (
    <section className={styles.inputs} aria-label="입력">
      <AmountInput
        id="salePrice"
        label="매매가"
        value={draft.salePrice}
        error={amountErrors.salePrice}
        onChange={(raw) => handleAmountChange("salePrice", raw)}
        onBlur={() => handleAmountBlur("salePrice")}
      />
      <AmountInput
        id={KB_PRICE_INPUT_ID}
        label="KB시세"
        value={draft.kbPrice}
        error={amountErrors.kbPrice}
        onChange={(raw) => handleAmountChange("kbPrice", raw)}
        onBlur={() => handleAmountBlur("kbPrice")}
      />
      <ChoiceGroup
        name="region"
        legend="주택 소재지"
        options={REGION_OPTIONS}
        value={draft.region}
        columns={3}
        onChange={(region) => onChange({ region })}
      />
      <ChoiceGroup
        name="borrower"
        legend="보유 상태"
        options={BORROWER_OPTIONS}
        value={draft.borrower}
        columns={2}
        onChange={(borrower) => onChange({ borrower })}
      />
      {draft.borrower === "noHomePreferred" && (
        <PreferredRequirements requirements={regulations.preferredBorrower} />
      )}
      <CustomLtvField value={draft.customLtv} onChange={(customLtv) => onChange({ customLtv })} />
    </section>
  );
}

export default LoanInputs;

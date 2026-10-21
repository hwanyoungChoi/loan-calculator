import { useState } from "react";

import { DEFAULT_DRAFT } from "@/lib/constants/draft";
import { BORROWER_LABELS, BORROWERS, REGION_LABELS, REGIONS } from "@/lib/constants/loanConditions";
import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { validateAmount } from "@/lib/utils/amount";
import { calculateLoan } from "@/lib/utils/calculateLoan";
import { toLoanInput } from "@/lib/utils/toLoanInput";

import styles from "./MortgageCalculator.module.css";
import AmountInput from "./components/AmountInput";
import ChoiceGroup from "./components/ChoiceGroup";
import ResultCard from "./components/ResultCard";
import SummaryBar from "./components/SummaryBar";

import type { Draft } from "@/lib/types/draft";

type AmountField = "salePrice" | "kbPrice";

const REGION_OPTIONS = REGIONS.map((value) => ({ value, label: REGION_LABELS[value] }));
const BORROWER_OPTIONS = BORROWERS.map((value) => ({ value, label: BORROWER_LABELS[value] }));

const NO_ERRORS: Record<AmountField, string | null> = { salePrice: null, kbPrice: null };

function amountErrorOf(raw: string): string | null {
  const validation = validateAmount(raw);
  return validation.status === "error" ? validation.message : null;
}

function MortgageCalculator() {
  // 입력 상태는 Draft와 같은 모양이다. 태스크 2-2에서 draft 스토어로 바꾼다.
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [amountErrors, setAmountErrors] = useState(NO_ERRORS);

  const updateDraft = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  // 오류는 blur에서 띄우고, 고쳐지면 입력 중에도 바로 걷는다.
  const handleAmountChange = (field: AmountField, raw: string) => {
    updateDraft({ [field]: raw });
    if (amountErrorOf(raw) === null) setAmountErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountBlur = (field: AmountField) => {
    setAmountErrors((prev) => ({ ...prev, [field]: amountErrorOf(draft[field]) }));
  };

  const loanInput = toLoanInput(draft);
  const result = loanInput === null ? null : calculateLoan(loanInput, LOAN_REGULATIONS);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>주담대 한도·자기자금 계산기</h1>
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
          id="kbPrice"
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
          onChange={(region) => updateDraft({ region })}
        />
        <ChoiceGroup
          name="borrower"
          legend="보유 상태"
          options={BORROWER_OPTIONS}
          value={draft.borrower}
          columns={2}
          onChange={(borrower) => updateDraft({ borrower })}
        />
      </section>
      <ResultCard input={loanInput} regulations={LOAN_REGULATIONS} />
      <SummaryBar result={result} />
    </div>
  );
}

export default MortgageCalculator;

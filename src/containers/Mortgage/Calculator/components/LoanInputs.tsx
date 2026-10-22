import { Fragment, useState, type ReactNode } from "react";

import AmountInput from "@/components/AmountInput";
import ChoiceGroup from "@/components/ChoiceGroup";
import { BORROWER_LABELS, BORROWERS, REGION_LABELS, REGIONS } from "@/lib/constants/loanConditions";
import { validateAmount } from "@/lib/utils/amount";

import { describeRegulationChoice } from "../ltvChoice";
import AreaOver85Switch from "./AreaOver85Switch";
import CollateralBaseLine from "./CollateralBaseLine";
import styles from "./LoanInputs.module.css";
import LtvChoiceField from "./LtvChoiceField";
import PreferredRequirements from "./PreferredRequirements";

import type { Draft } from "@/lib/types/draft";
import type { Regulations } from "@/lib/types/regulation";

type AmountField = "salePrice" | "kbPrice";

/** KB시세를 사용자가 직접 확인하러 가는 링크. 앱은 이 사이트에 요청하지 않는다(ADR-019). */
const KB_LAND_URL = "https://kbland.kr/";

type LoanInputsProps = {
  draft: Draft;
  regulations: Regulations;
  onChange: (patch: Partial<Draft>) => void;
  /** KB시세 보조 줄의 실거래가 버튼. 시트를 닫으면 포커스를 그 버튼으로 돌려준다 */
  onOpenTrades: (button: HTMLButtonElement) => void;
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

/** 스크린샷 적용 뒤 직접 입력할 칸이라 계산 화면이 이 id로 포커스를 옮긴다. */
export const KB_PRICE_INPUT_ID = "kbPrice";
/** 저장 뒤 다음 매물을 입력할 칸이라 계산 화면이 이 id로 포커스를 옮긴다. */
export const SALE_PRICE_INPUT_ID = "salePrice";

function amountErrorOf(raw: string): string | null {
  const validation = validateAmount(raw);
  return validation.status === "error" ? validation.message : null;
}

/**
 * 계산 입력부: 금액 2개(KB시세 입력 보조)와 기준 금액, 소재지, 보유 상태(서민·실수요자 요건 안내), 85㎡ 초과, LTV 직접 입력.
 * KB시세는 공식 API가 없어 가져오지 않는다(ADR-019, ADR-022 D8). 참고용 실거래가로만 안내한다.
 */
function LoanInputs({ draft, regulations, onChange, onOpenTrades }: LoanInputsProps) {
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
        id={SALE_PRICE_INPUT_ID}
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
      <div className={styles.kbHelp}>
        <p>KB부동산에서 확인해 입력하세요(자동으로 가져올 수 없음)</p>
        <div className={styles.kbActions}>
          <a
            href={KB_LAND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.textButton}
          >
            KB시세 확인하러 가기 ↗
          </a>
          <button
            type="button"
            className={styles.textButton}
            onClick={(event) => onOpenTrades(event.currentTarget)}
          >
            이 단지 실거래가 보기
          </button>
        </div>
      </div>
      <CollateralBaseLine salePrice={draft.salePrice} kbPrice={draft.kbPrice} />
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
      <AreaOver85Switch
        checked={draft.isAreaOver85}
        ruralSpecialRateBp={regulations.purchaseCosts.acquisitionTax.ruralSpecial.standardRateBp}
        onChange={(isAreaOver85) => onChange({ isAreaOver85 })}
      />
      <LtvChoiceField
        customLtv={draft.customLtv}
        isCustomLtvInput={draft.isCustomLtvInput}
        regulationLabel={describeRegulationChoice(draft, regulations)}
        onChange={onChange}
      />
    </section>
  );
}

export default LoanInputs;

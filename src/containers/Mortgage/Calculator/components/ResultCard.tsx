import { PRICE_SOURCE_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { calculateLoan, hasUnconfirmedOwnFunds } from "@/lib/utils/calculateLoan";
import { describeCondition } from "@/lib/utils/describeCondition";

import CapRow from "./CapRow";
import ExtraCostResultRows from "./ExtraCostResultRows";
import LtvRow from "./LtvRow";
import PurchaseCostRows from "./PurchaseCostRows";
import RegulationBasis from "./RegulationBasis";
import styles from "./ResultCard.module.css";
import ResultRow from "./ResultRow";

import type { LoanInput, LoanResult } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";
import type { ExtraCostSummary } from "@/lib/utils/extraCosts";

type ResultCardProps = {
  /** 계산할 수 있는 입력. 입력이 덜 됐을 때는 `EmptyResultCard`를 쓴다. */
  input: LoanInput;
  /** 테스트에서 미확인 fixture를 끼워 넣을 수 있도록 prop으로 받는다(ADR-008). */
  regulations: Regulations;
  /** 추가 비용 줄의 상태. 없으면 줄이 없는 것으로 보고 두 줄을 그리지 않는다(기존 화면 그대로). */
  extraCosts?: ExtraCostSummary;
};

const NO_EXTRA_COSTS: ExtraCostSummary = { status: "none" };

type StatusNotices = {
  [Status in LoanResult["status"]]: (
    result: Extract<LoanResult, { status: Status }>,
    regulations: Regulations,
  ) => string | null;
};

/** 계산하지 않은 이유. 상태가 늘면 여기 등록하지 않은 것이 타입 검사에서 걸린다. */
const STATUS_NOTICES: StatusNotices = {
  ok: () => null,
  unconfirmed: () => "이 조건의 LTV는 1차 출처로 확인되지 않아 계산하지 않습니다",
  ineligible: (result, regulations) =>
    `주택가격 ${formatManwon(result.eligibilityPrice)}(${PRICE_SOURCE_LABELS[result.eligibilityPriceSource]})이 ` +
    `${formatManwon(regulations.preferredBorrower.maxHousePrice)}을 넘어 서민·실수요자 우대 대상이 아닙니다. ` +
    "보유 상태를 '무주택'으로 바꿔 계산하세요",
};

function describeStatus(result: LoanResult, regulations: Regulations): string | null {
  // 상태와 결과 모양이 짝지어져 있음을 TS가 인덱스 접근에서 따라가지 못해 한 번 넓힌다.
  const notice = STATUS_NOTICES[result.status] as (
    result: LoanResult,
    regulations: Regulations,
  ) => string | null;
  return notice(result, regulations);
}

/** 앱은 주택가격만 판정한다. 라디오 아래 안내는 고를 때만 보이므로 결과에도 남긴다. */
const UNVERIFIED_REQUIREMENTS = "소득·무주택세대주 요건은 확인하지 않았습니다";

/**
 * 계산 과정을 숨기지 않는다: 기준 금액 → LTV → LTV 금액 → 상한 → 예상 한도 → 집값 중 내 돈(매매가 − 예상 한도) → 취득세 등 → 중개보수 → 자기자금.
 * 부대비용에 미확인 항목(다주택 중과 농특세)이 있으면 자기자금을 지우지 않고 그 항목만 뺀 값과 표시를 함께 보여 준다(ADR-022).
 * 추가 비용 줄이 있으면 자기자금(답) 아래에 "추가 비용"과 "총 필요 금액"을 붙인다. 답은 자기자금 하나라 총 필요 금액은 한 단계 작게 둔다(ADR-024).
 */
function ResultCard({ input, regulations, extraCosts = NO_EXTRA_COSTS }: ResultCardProps) {
  const result = calculateLoan(input, regulations);
  const statusNotice = describeStatus(result, regulations);

  return (
    <section className={styles.card} aria-label="계산 결과">
      <div className={styles.header}>
        <h2 className={styles.condition}>
          {describeCondition(input.region, input.borrower, input.customLtvRate)}
        </h2>
        {input.borrower === "noHomePreferred" && (
          <p className={styles.unverified}>{UNVERIFIED_REQUIREMENTS}</p>
        )}
      </div>
      <dl className={styles.rows}>
        <ResultRow
          label={
            <>
              기준 금액
              <br />
              (매매가·KB시세 중 낮은 쪽)
            </>
          }
          value={formatManwon(result.collateralBase)}
          details={PRICE_SOURCE_LABELS[result.collateralSource]}
        />
        <LtvRow result={result} />
        <ResultRow label="LTV 금액" value={formatManwonOrDash(result.ltvAmount)} />
        <CapRow cap={result.cap} />
        <ResultRow
          label="예상 한도"
          value={formatManwonOrDash(result.loanLimit)}
          variant="emphasis"
        />
        <ResultRow
          label="집값 중 내 돈"
          value={formatManwonOrDash(result.downPayment)}
          details="매매가 − 예상 한도"
        />
        <PurchaseCostRows input={input} costs={result.purchaseCosts} regulations={regulations} />
        <ResultRow
          label="필요한 자기자금"
          value={formatManwonOrDash(result.ownFunds)}
          details={hasUnconfirmedOwnFunds(result) ? "농특세 미확인(빼고 계산한 값)" : undefined}
          variant="answer"
        />
        <ExtraCostResultRows extraCosts={extraCosts} ownFunds={result.ownFunds} />
      </dl>
      {statusNotice !== null && <p className={styles.statusNotice}>{statusNotice}</p>}
      <p className={styles.scope}>DSR·소득 심사 미반영. 등기 비용(법무사·채권·인지세)은 제외</p>
      <RegulationBasis input={input} result={result} regulations={regulations} />
    </section>
  );
}

export default ResultCard;

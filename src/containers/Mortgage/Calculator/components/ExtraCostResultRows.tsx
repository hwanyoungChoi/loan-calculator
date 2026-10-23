import { formatManwon, formatManwonOrDash } from "@/lib/utils/amount";
import { totalRequired, type ExtraCostSummary } from "@/lib/utils/extraCosts";

import ResultRow from "./ResultRow";

type ExtraCostResultRowsProps = {
  extraCosts: ExtraCostSummary;
  /** 필요한 자기자금. 계산하지 못했으면 null이고 총 필요 금액도 "—"다. */
  ownFunds: number | null;
};

/**
 * 결과 카드의 "추가 비용"·"총 필요 금액" 두 줄. 줄이 없으면 그리지 않는다(기존 화면 그대로).
 * 확인할 줄이 있으면 두 값 모두 "—"다. 화면의 답은 자기자금 하나라 총 필요 금액은 emphasis다(ADR-024).
 */
function ExtraCostResultRows({ extraCosts, ownFunds }: ExtraCostResultRowsProps) {
  if (extraCosts.status === "none") return null;
  const isValid = extraCosts.status === "valid";
  return (
    <>
      <ResultRow
        label="추가 비용"
        value={isValid ? formatManwon(extraCosts.total) : "—"}
        details={isValid ? `${extraCosts.count}개 항목` : "확인할 항목이 있습니다"}
      />
      <ResultRow
        label="총 필요 금액"
        value={formatManwonOrDash(isValid ? totalRequired(ownFunds, extraCosts.total) : null)}
        details="자기자금 + 추가 비용"
        variant="emphasis"
      />
    </>
  );
}

export default ExtraCostResultRows;

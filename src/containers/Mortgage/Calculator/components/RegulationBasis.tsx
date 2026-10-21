import styles from "./ResultCard.module.css";

import type { LoanResult } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type RegulationBasisProps = {
  result: LoanResult;
  regulations: Regulations;
};

function findSourceTitle(regulations: Regulations, url: string): string {
  return regulations.sources.find((source) => source.url === url)?.title ?? url;
}

function SourceLink({ regulations, url }: { regulations: Regulations; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
      {findSourceTitle(regulations, url)}
    </a>
  );
}

/** 결과 카드 하단의 기준일과 근거. 적용된 LTV 셀과 한도 상한의 출처·시행일을 펼쳐 보여준다. */
function RegulationBasis({ result, regulations }: RegulationBasisProps) {
  const { ltv, cap } = result;

  return (
    <details className={styles.basis}>
      <summary className={styles.basisSummary}>
        규제 기준일 {regulations.baseDate} · <span className={styles.basisToggle}>근거 보기</span>
      </summary>
      <ul className={styles.basisList}>
        <li>
          <strong>적용 LTV</strong>{" "}
          {ltv.sourceUrl === null ? (
            "1차 출처 미확인"
          ) : (
            <SourceLink regulations={regulations} url={ltv.sourceUrl} />
          )}
          {ltv.effectiveDate !== null && <> · 시행 {ltv.effectiveDate}</>}
          {ltv.note !== undefined && <p className={styles.basisNote}>{ltv.note}</p>}
        </li>
        {cap !== null && (
          <li>
            <strong>한도 상한</strong>{" "}
            <SourceLink regulations={regulations} url={regulations.loanCap.sourceUrl} /> · 시행{" "}
            {regulations.loanCap.effectiveDate}
          </li>
        )}
      </ul>
    </details>
  );
}

export default RegulationBasis;

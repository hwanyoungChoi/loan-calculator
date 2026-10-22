import styles from "./ResultCard.module.css";

import type { LoanInput, LoanResult } from "@/lib/types/loan";
import type { Regulations } from "@/lib/types/regulation";

type RegulationBasisProps = {
  input: LoanInput;
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

/**
 * 결과 카드 하단의 기준일과 근거. 이 조건의 규제 LTV 셀, 서민·실수요자 요건, 한도 상한의 출처·시행일을 펼쳐 보여준다.
 * 사용자 지정 LTV면 맨 위에 규제 근거가 아님을 밝히고, 셀은 병기한 규제 기준의 근거로 남긴다.
 */
function RegulationBasis({ input, result, regulations }: RegulationBasisProps) {
  const cell = regulations.ltvTable[input.region][input.borrower];
  const isCustom = result.appliedLtv?.source === "custom";
  const { preferredBorrower } = regulations;

  return (
    <details className={styles.basis}>
      <summary className={styles.basisSummary}>
        규제 기준일 {regulations.baseDate} · <span className={styles.basisToggle}>근거 보기</span>
      </summary>
      <ul className={styles.basisList}>
        {isCustom && (
          <li>
            <strong>LTV: 사용자 입력(규제 근거 아님)</strong>
          </li>
        )}
        <li>
          <strong>{isCustom ? "규제 기준 LTV" : "적용 LTV"}</strong>{" "}
          {cell.sourceUrl === null ? (
            "1차 출처 미확인"
          ) : (
            <SourceLink regulations={regulations} url={cell.sourceUrl} />
          )}
          {cell.effectiveDate !== null && <> · 시행 {cell.effectiveDate}</>}
          {cell.note !== undefined && <p className={styles.basisNote}>{cell.note}</p>}
        </li>
        {input.borrower === "noHomePreferred" && (
          <li>
            <strong>서민·실수요자 요건</strong>{" "}
            <SourceLink regulations={regulations} url={preferredBorrower.sourceUrl} /> · 시행{" "}
            {preferredBorrower.effectiveDate}
          </li>
        )}
        {result.cap !== null && (
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

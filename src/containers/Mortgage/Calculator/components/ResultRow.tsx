import styles from "./ResultCard.module.css";

import type { ReactNode } from "react";

/** emphasis는 중간 합계(예상 한도), answer는 화면의 답(필요한 자기자금)이라 가장 크게 둔다. */
type ResultRowVariant = "default" | "emphasis" | "answer";

const ROW_CLASS: Record<ResultRowVariant, string> = {
  default: styles.row,
  emphasis: styles.emphasisRow,
  answer: styles.answerRow,
};

type ResultRowProps = {
  label: ReactNode;
  value: ReactNode;
  /** 값 아래에 붙는 설명 줄 */
  details?: ReactNode;
  variant?: ResultRowVariant;
};

function ResultRow({ label, value, details, variant = "default" }: ResultRowProps) {
  return (
    <div className={ROW_CLASS[variant]}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{value}</dd>
      {details !== undefined && <dd className={styles.rowDetails}>{details}</dd>}
    </div>
  );
}

export default ResultRow;

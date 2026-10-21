import styles from "./ResultCard.module.css";

import type { ReactNode } from "react";

type ResultRowVariant = "default" | "emphasis";

const ROW_CLASS: Record<ResultRowVariant, string> = {
  default: styles.row,
  emphasis: styles.emphasisRow,
};

type ResultRowProps = {
  label: string;
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

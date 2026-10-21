import styles from "./ResultCard.module.css";

import type { LtvCell } from "@/lib/types/regulation";

/** 미확인(null)과 확인된 0%를 구분해 보여준다. falsy 검사를 하지 않는다. */
function LtvValue({ ltv }: { ltv: LtvCell }) {
  if (ltv.rate === null) return <span className={styles.badge}>미확인</span>;
  if (ltv.rate === 0) return <>LTV 0% · 주택구입 목적 주담대 불가</>;
  return <>{ltv.rate}%</>;
}

export default LtvValue;

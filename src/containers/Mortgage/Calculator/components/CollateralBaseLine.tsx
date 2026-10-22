import { PRICE_SOURCE_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon, validateAmount } from "@/lib/utils/amount";
import { selectCollateralBase } from "@/lib/utils/calculateLoan";

import styles from "./CollateralBaseLine.module.css";

type CollateralBaseLineProps = {
  /** 쉼표를 뺀 입력 문자열 */
  salePrice: string;
  kbPrice: string;
};

/** LTV를 곱하는 기준 금액(매매가·KB시세 중 낮은 쪽). 결과 카드가 계산하지 않는 상태여도 보인다. 두 금액을 다 쓰기 전에는 그리지 않는다. */
function CollateralBaseLine({ salePrice, kbPrice }: CollateralBaseLineProps) {
  const sale = validateAmount(salePrice);
  const kb = validateAmount(kbPrice);
  const base =
    sale.status === "valid" && kb.status === "valid"
      ? selectCollateralBase(sale.value, kb.value)
      : null;
  if (base === null) return null;

  return (
    <p className={styles.line}>
      <span className={styles.label}>기준 금액(낮은 쪽)</span>
      <strong className={styles.amount}>{formatManwon(base.collateralBase)}</strong>
      <span className={styles.source}>{PRICE_SOURCE_LABELS[base.collateralSource]}</span>
    </p>
  );
}

export default CollateralBaseLine;

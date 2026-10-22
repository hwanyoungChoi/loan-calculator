import { PRICE_SOURCE_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon, validateAmount } from "@/lib/utils/amount";
import { selectCollateralBase } from "@/lib/utils/calculateLoan";

import styles from "./CollateralBaseLine.module.css";

type CollateralBaseLineProps = {
  /** 쉼표를 뺀 입력 문자열 */
  salePrice: string;
  kbPrice: string;
};

/** 두 금액을 다 쓰기 전에는 같은 모양을 숨겨 자리만 지킨다. 줄이 나타날 때 아래 입력이 밀리지 않는다. */
const PLACEHOLDER = { amount: "—", source: "—" };

/** LTV를 곱하는 기준 금액(매매가·KB시세 중 낮은 쪽). 결과 카드가 계산하지 않는 상태여도 보인다. */
function CollateralBaseLine({ salePrice, kbPrice }: CollateralBaseLineProps) {
  const sale = validateAmount(salePrice);
  const kb = validateAmount(kbPrice);
  const base =
    sale.status === "valid" && kb.status === "valid"
      ? selectCollateralBase(sale.value, kb.value)
      : null;
  const shown =
    base === null
      ? PLACEHOLDER
      : {
          amount: formatManwon(base.collateralBase),
          source: PRICE_SOURCE_LABELS[base.collateralSource],
        };

  return (
    <p className={base === null ? styles.hidden : styles.line} aria-hidden={base === null}>
      <span className={styles.label}>기준 금액(낮은 쪽)</span>
      <strong className={styles.amount}>{shown.amount}</strong>
      <span className={styles.source}>{shown.source}</span>
    </p>
  );
}

export default CollateralBaseLine;

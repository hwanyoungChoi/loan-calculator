import { formatTradeRow } from "../formatTradeRow";
import styles from "./TradeResults.module.css";

import type { AptTrade } from "@/lib/types/aptTrade";

function TradeRow({ trade }: { trade: AptTrade }) {
  const { title, amount, detail } = formatTradeRow(trade);
  return (
    <li className={styles.row}>
      <div className={styles.rowTop}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowAmount}>{amount}</span>
      </div>
      <p className={styles.rowDetail}>{detail}</p>
    </li>
  );
}

export default TradeRow;

import styles from "./ResultCard.module.css";

/** 계산할 수 없을 때 결과 카드 자리. 무엇을 입력해야 하는지 알려 준다. */
function EmptyResultCard({ message }: { message: string }) {
  return (
    <section className={styles.card} aria-label="계산 결과">
      <p className={styles.empty}>{message}</p>
    </section>
  );
}

export default EmptyResultCard;

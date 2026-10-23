import styles from "./SharePanel.module.css";

import type { ReactNode } from "react";

type SharePanelProps = {
  title: string;
  description?: string;
  /** 다음 동작(링크·버튼) */
  children?: ReactNode;
};

/** 공유받기의 로딩·사라진 링크·오류 안내. 상태가 바뀌어도 같은 자리에 같은 모양으로 앉는다. */
function SharePanel({ title, description, children }: SharePanelProps) {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{title}</h1>
      {description !== undefined && <p className={styles.description}>{description}</p>}
      {children}
    </section>
  );
}

export default SharePanel;

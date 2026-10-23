import { useEffect, useId, useRef, type ReactNode } from "react";

import styles from "./Sheet.module.css";

type SheetProps = {
  title: string;
  /** Esc와 닫기 버튼. 열고 닫기·포커스 복귀·뒤 화면 inert는 `useOpenSheet`가 맡는다. */
  onClose: () => void;
  children: ReactNode;
};

/**
 * 하단 시트 공통 프레임(계산 화면, 저장 목록). 히스토리에 넣지 않는다(ADR-017): 모바일 뒤로 가기는 이전 화면 이동이다.
 * 높이는 뷰포트의 90% 안이고, 넘치는 내용은 시트 안에서 스크롤한다.
 */
function Sheet({ title, onClose, children }: SheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // 보조기기가 시트를 읽기 시작하도록 포커스를 안으로 옮긴다. 안쪽 칸이 autoFocus로 이미 가져갔으면 둔다.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.contains(document.activeElement)) dialog.focus();
  }, []);

  // 누른 버튼이 사라지면("더 보기") 포커스가 body로 빠진다. 그때도 Esc가 닫도록 문서에서 듣는다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Sheet;

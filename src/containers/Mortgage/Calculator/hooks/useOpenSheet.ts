import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";

/** 계산 화면의 시트. 한 번에 하나만 열린다(ADR-017). */
export type SheetName = "save" | "paste" | "trades";

/**
 * 열린 시트 하나와 닫을 때 포커스를 돌려줄 자리를 관리한다.
 * 시트가 열린 동안 뒤 화면은 `isOpen`으로 inert를 건다(aria-modal이 약속하는 동작).
 */
export function useOpenSheet() {
  const [openSheet, setOpenSheet] = useState<SheetName | null>(null);
  // 클릭으로 버튼에 포커스가 가지 않는 브라우저(Safari)가 있어 activeElement 대신 여는 쪽이 자리를 넘긴다.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = (sheet: SheetName, returnFocusTo: HTMLElement | null) => {
    returnFocusRef.current = returnFocusTo;
    setOpenSheet(sheet);
  };

  /** 배경의 inert가 먼저 풀려야 포커스할 수 있으므로 닫기를 동기로 반영한 뒤 포커스를 돌려준다. */
  // 시트가 Esc 리스너를 다시 달지 않도록 같은 함수를 유지한다.
  const close = useCallback(() => {
    flushSync(() => setOpenSheet(null));
    returnFocusRef.current?.focus();
  }, []);

  return { openSheet, isOpen: openSheet !== null, open, close };
}

import { PATHS } from "@/lib/constants/paths";

import styles from "./TabNav.module.css";

import type { TabName } from "@/lib/types/route";
import type { MouseEvent } from "react";

type TabNavProps = {
  /** null이면 어느 탭도 선택 표시하지 않는다(공유받기 화면) */
  current: TabName | null;
  /** 탭으로 화면을 바꾸기 직전에 부른다. */
  onNavigate: () => void;
};

const TABS: Record<TabName, { label: string; href: string }> = {
  calculator: { label: "계산", href: PATHS.calculator },
  listings: { label: "저장 목록", href: PATHS.listings() },
};

const TAB_ORDER: TabName[] = ["calculator", "listings"];

/** 새 탭에서 열기 같은 브라우저 기본 동작은 막지 않는다. */
function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** 상단 탭 "계산 | 저장 목록". 탭을 오가도 뒤로 가기 이력이 쌓이지 않게 replace로 이동한다. */
function TabNav({ current, onNavigate }: TabNavProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    onNavigate();
    window.location.replace(href);
  };

  return (
    <nav className={styles.nav} aria-label="화면">
      <ul className={styles.tabs}>
        {TAB_ORDER.map((name) => (
          <li key={name} className={styles.item}>
            <a
              className={styles.tab}
              href={TABS[name].href}
              aria-current={name === current ? "page" : undefined}
              onClick={(event) => handleClick(event, TABS[name].href)}
            >
              {TABS[name].label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TabNav;

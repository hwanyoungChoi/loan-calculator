import { PATHS } from "@/lib/constants/paths";

import styles from "./TabNav.module.css";

import type { Route } from "@/lib/types/route";

type RouteName = Route["name"];

type TabNavProps = {
  current: RouteName;
};

const TABS: Record<RouteName, { label: string; href: string }> = {
  calculator: { label: "계산", href: PATHS.calculator },
  listings: { label: "저장 목록", href: PATHS.listings() },
};

const TAB_ORDER: RouteName[] = ["calculator", "listings"];

/** 상단 탭 "계산 | 저장 목록" */
function TabNav({ current }: TabNavProps) {
  return (
    <nav className={styles.nav} aria-label="화면">
      <ul className={styles.tabs}>
        {TAB_ORDER.map((name) => (
          <li key={name} className={styles.item}>
            <a
              className={styles.tab}
              href={TABS[name].href}
              aria-current={name === current ? "page" : undefined}
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

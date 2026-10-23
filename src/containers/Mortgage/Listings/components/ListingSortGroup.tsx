import { LISTING_SORTS } from "@/lib/constants/listingsView";

import styles from "./ListingSortGroup.module.css";

import type { ListingSort, ListingSortOrder } from "@/lib/types/listing";

type ListingSortGroupProps = {
  sort: ListingSort;
  order: ListingSortOrder;
  /** 고른 정렬. 이미 선택된 정렬을 다시 누르면 같은 값으로 부른다(방향 전환). */
  onSelect: (sort: ListingSort) => void;
};

/** 방향은 화살표와 함께 보조기기용 이름에도 글로 넣는다(WAI-ARIA APG sortable table). */
const SORT_OPTIONS: Record<
  ListingSort,
  { label: string; orderLabels: Record<ListingSortOrder, string> }
> = {
  ownFunds: { label: "자기자금순", orderLabels: { asc: "적은 금액부터", desc: "많은 금액부터" } },
  recent: { label: "최근 저장순", orderLabels: { asc: "오래된 것부터", desc: "최신부터" } },
  name: { label: "가나다순", orderLabels: { asc: "가에서 하", desc: "하에서 가" } },
};

const ORDER_ARROWS: Record<ListingSortOrder, string> = { asc: "↑", desc: "↓" };

/**
 * 저장 목록 정렬. 네이티브 라디오는 이미 선택된 칸을 다시 누르면 change가 오지 않아 `aria-pressed` 버튼으로 둔다.
 * 마우스·터치·키보드(Space/Enter) 모두 click으로 들어온다. 모양은 ChoiceGroup 칩과 같다.
 */
function ListingSortGroup({ sort, order, onSelect }: ListingSortGroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>정렬</legend>
      <div className={styles.options}>
        {LISTING_SORTS.map((value) => {
          const isSelected = value === sort;
          const { label, orderLabels } = SORT_OPTIONS[value];
          return (
            <button
              key={value}
              type="button"
              className={styles.option}
              aria-pressed={isSelected}
              aria-label={isSelected ? `${label}, ${orderLabels[order]}` : undefined}
              onClick={() => onSelect(value)}
            >
              {label}
              {isSelected && <span className={styles.arrow}>{ORDER_ARROWS[order]}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default ListingSortGroup;

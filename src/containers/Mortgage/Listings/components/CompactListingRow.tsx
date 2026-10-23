import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ComponentProps } from "react";

import styles from "./CompactListingRow.module.css";
import CompactListingSummary from "./CompactListingSummary";
import ListingCard from "./ListingCard";

type CompactListingRowProps = ComponentProps<typeof ListingCard> & {
  /** 순서를 바꿀 수 있는 상태인지(순서 출처가 정해졌고 저장 중이 아님) */
  canReorder: boolean;
};

/** 보조기기가 읽는 역할 이름. 버튼이면서 끌어 옮길 수 있는 줄이다. */
const ROLE_DESCRIPTION = "순서를 바꿀 수 있는 버튼";

/**
 * 간단히 보기의 한 줄: 이름과 필요한 자기자금. 누르면 아래로 상세 카드를 펼치고, 다시 누르면 접는다.
 * 꾹 누르거나(스페이스 키) 들어 끌면 순서를 바꾼다(ADR-026). 펼친 줄은 들 수 없고(접은 뒤 끈다) 다른 줄이 지나갈 자리는 된다.
 */
function CompactListingRow({ canReorder, ...props }: CompactListingRowProps) {
  const { listing, regulations, budget } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const isDraggable = canReorder && !isExpanded;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: listing.id,
    disabled: { draggable: !isDraggable, droppable: !canReorder },
    attributes: { roleDescription: ROLE_DESCRIPTION },
  });
  // 들 수 없을 때는 끌기 속성(aria-disabled 등)을 붙이지 않는다. 펼치기 버튼으로는 계속 쓸 수 있다.
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? styles.placeholder : styles.item}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...dragProps}
        className={isDraggable ? styles.draggableRow : styles.row}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((isOpen) => !isOpen)}
      >
        <CompactListingSummary
          listing={listing}
          regulations={regulations}
          budget={budget}
          isExpanded={isExpanded}
        />
      </button>
      {isExpanded && (
        <div className={styles.detail}>
          <ListingCard {...props} />
        </div>
      )}
    </li>
  );
}

export default CompactListingRow;

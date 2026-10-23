import { DEFAULT_CUSTOM_LTV } from "@/lib/constants/draft";
import { formatManwon, validateAmount } from "@/lib/utils/amount";

import styles from "./ScreenshotSheet.module.css";

import type { ParsedListingText } from "@/lib/utils/parseListingText";

type ListingPreviewProps = {
  parsed: ParsedListingText;
  /** 지금 매매가 칸의 입력(쉼표 없음) */
  currentSalePrice: string;
  isEditing: boolean;
  /** LTV 직접 입력이 이미 기본값(켜짐·70)인지. 아니면 적용 때 기본값으로 돌아간다는 것을 알린다. */
  isLtvDefault: boolean;
  /** 지금 추가 비용 줄 수. 적용하면 비워진다(스펙 U6). */
  extraCostCount: number;
};

const NOT_FOUND = "찾지 못함";

/** 스크린샷에서 읽은 값과 "적용"이 바꿀 것. 단지명은 추정이라 그대로 보여 주고 사용자가 확인한다. */
function ListingPreview({
  parsed,
  currentSalePrice,
  isEditing,
  isLtvDefault,
  extraCostCount,
}: ListingPreviewProps) {
  const salePriceText = formatManwon(parsed.salePrice);
  const current = validateAmount(currentSalePrice);
  const facts = [
    { label: "매매가", value: salePriceText },
    { label: "단지(추정)", value: parsed.complexName ?? NOT_FOUND },
    { label: "면적", value: parsed.areaText ?? NOT_FOUND },
  ];
  const applyNotes = [
    "KB시세는 비워집니다",
    ...(parsed.complexName === null ? [] : ["실거래가 단지명 칸에도 채웁니다"]),
    ...(isEditing ? ["불러온 매물에 덮어쓰지 않고 새 매물로 계산합니다"] : []),
    ...(isLtvDefault ? [] : [`LTV는 기본 ${DEFAULT_CUSTOM_LTV}%로 돌아갑니다`]),
    ...(extraCostCount === 0 ? [] : [`추가 비용 ${extraCostCount}줄이 비워집니다`]),
  ];

  return (
    <div className={styles.preview}>
      <dl className={styles.facts}>
        {facts.map(({ label, value }) => (
          <div key={label} className={styles.fact}>
            <dt className={styles.factLabel}>{label}</dt>
            <dd className={styles.factValue}>{value}</dd>
          </div>
        ))}
      </dl>
      {current.status === "valid" && (
        <p className={styles.change}>
          현재 {formatManwon(current.value)} → {salePriceText}
        </p>
      )}
      <ul className={styles.notes}>
        {applyNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

export default ListingPreview;

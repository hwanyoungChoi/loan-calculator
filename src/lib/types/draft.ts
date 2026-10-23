import type { ExtraCostCategory } from "./extraCost";
import type { Borrower, Region } from "./regulation";

/**
 * 추가 비용 입력 중인 한 줄. `id`는 줄 편집용(React key·포커스)이고 매물에는 저장하지 않는다.
 * 이름·금액은 입력 중인 문자열 그대로(금액은 쉼표 제거)라 틀린 값도 새로고침 뒤 그대로 보인다.
 */
export type ExtraCostDraftRow = {
  id: string;
  category: ExtraCostCategory;
  label: string;
  amount: string;
};

/** 계산 화면의 작성 중 입력. 금액은 입력 중인 문자열(쉼표 제거)이다. */
export type Draft = {
  salePrice: string;
  kbPrice: string;
  region: Region;
  borrower: Borrower;
  listingId: string | null;
  /** 사용자 지정 LTV. null이면 규제대로, 문자열이면 칩 값(40·70·80)이나 직접 입력 중인 값 */
  customLtv: string | null;
  /** [직접 입력] 칩을 골랐는지. 직접 입력한 값이 칩 값과 같아도 입력칸을 유지하려고 따로 둔다. */
  isCustomLtvInput: boolean;
  isAreaOver85: boolean;
  /** 입력 순서. 화면은 분류별로 묶어 보인다(ADR-024) */
  extraCosts: ExtraCostDraftRow[];
};

export type DraftStore = {
  getSnapshot: () => Draft;
  subscribe: (listener: () => void) => () => void;
  update: (patch: Partial<Draft>) => void;
  clear: () => void;
};

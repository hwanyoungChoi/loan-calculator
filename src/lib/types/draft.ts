import type { Borrower, Region } from "./regulation";

/** 계산 화면의 작성 중 입력. 금액은 입력 중인 문자열(쉼표 제거)이다. */
export type Draft = {
  salePrice: string;
  kbPrice: string;
  region: Region;
  borrower: Borrower;
  listingId: string | null;
  /** LTV 직접 입력. null이면 꺼짐, 문자열이면 입력 중인 값 */
  customLtv: string | null;
  isAreaOver85: boolean;
};

export type DraftStore = {
  getSnapshot: () => Draft;
  subscribe: (listener: () => void) => () => void;
  update: (patch: Partial<Draft>) => void;
  clear: () => void;
};

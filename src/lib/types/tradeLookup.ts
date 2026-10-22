/** 실거래가 시트의 조회 기억(ADR-017). draft와 별도 키라 매물 열기·새 계산이 지우지 않는다. */
export type TradeLookupStore = {
  /** 마지막으로 고른 시군구 5자리. 없거나 읽을 수 없으면 null */
  load: () => string | null;
  /** 실패(시크릿 모드 등)는 조용히 넘긴다. 기억은 편의 기능이다. */
  save: (lawdCd: string) => void;
};

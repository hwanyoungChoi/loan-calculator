// GET /api/apt-trades 계약. 서버(server/, functions/)도 type-only import로 이 파일을 쓴다(계약의 원본은 한 곳).

export type AptTrade = {
  aptName: string;
  /** 법정동. 같은 이름 단지 구분용 */
  umdName: string | null;
  /** 전용면적 ㎡ */
  exclusiveArea: number;
  floor: number | null;
  /** 만원 정수 */
  dealAmount: number;
  /** YYYY-MM-DD */
  dealDate: string;
};

export type AptTradesResponse = {
  lawdCd: string;
  /** 조회한 YYYYMM, 최신 먼저. 기준은 서버 시각의 KST 달 */
  months: string[];
  /** 해제 거래 제외, aptName 필터 적용 후, dealDate 내림차순 → 같은 날 dealAmount 내림차순 */
  items: AptTrade[];
  source: { name: "국토교통부 아파트 매매 실거래가"; url: string };
};

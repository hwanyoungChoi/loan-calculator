/** 국토교통부 아파트 매매 실거래가 기본 자료(ADR-015 개정: 발급 키가 이 API용이고 해제 필드가 있다) */
const UPSTREAM_ENDPOINT =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

/** 달마다 한 페이지에 요청하는 행 수(가정 A8) */
export const PAGE_SIZE = 1000;

type UpstreamParams = {
  /** 포털의 Decoding 키(원문). 인코딩은 URLSearchParams가 한다(가정 A9) */
  serviceKey: string;
  lawdCd: string;
  dealYmd: string;
  pageNo: number;
};

export function buildUpstreamUrl({ serviceKey, lawdCd, dealYmd, pageNo }: UpstreamParams): string {
  const url = new URL(UPSTREAM_ENDPOINT);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(PAGE_SIZE));
  url.searchParams.set("_type", "json");
  return url.toString();
}

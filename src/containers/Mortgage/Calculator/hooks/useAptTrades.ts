import { skipToken, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { AptTradesResponse } from "@/lib/types/aptTrade";

export type AptTradeListParams = {
  lawdCd: string;
  months: number;
  /** trim한 단지명. 비어 있으면 보내지 않는다 */
  aptName?: string;
};

/** 다시 열었을 때 같은 조회는 캐시에서 바로 띄운다. 업스트림 일일 한도도 아낀다. */
const STALE_TIME_MS = 10 * 60 * 1000;

export const aptTradeListQueryKey = (params?: AptTradeListParams) =>
  params ? (["aptTrade", "list", params] as const) : (["aptTrade", "list"] as const);

const fetchAptTrades = (params: AptTradeListParams) =>
  apiClient.get<AptTradesResponse>("/api/apt-trades", { params });

/** 실거래가 시트 안에서만 부른다. params가 null(시군구 미선택)이면 요청하지 않는다. */
export function useAptTrades(params: AptTradeListParams | null) {
  return useQuery({
    queryKey: aptTradeListQueryKey(params ?? undefined),
    queryFn: params === null ? skipToken : () => fetchAptTrades(params),
    staleTime: STALE_TIME_MS,
  });
}

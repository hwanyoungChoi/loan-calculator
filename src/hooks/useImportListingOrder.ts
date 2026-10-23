import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingOrderQueryKey } from "./useAccountListingOrder";

import type { ImportListingOrderRequest, ImportListingOrderResponse } from "@/lib/types/account";

const importListingOrder = (ids: string[]) =>
  apiClient.post<ImportListingOrderResponse>("/api/listing-order/import", {
    ids,
  } satisfies ImportListingOrderRequest);

/** 기기 순서를 계정 순서가 비어 있을 때만 올린다. 응답은 계정의 현재 값이라 그대로 캐시에 넣는다. */
export function useImportListingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importListingOrder,
    onSuccess: (response) => queryClient.setQueryData(listingOrderQueryKey(), response.ids),
  });
}

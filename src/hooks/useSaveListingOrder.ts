import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingOrderQueryKey } from "./useAccountListingOrder";

import type { ListingOrderRequest, ListingOrderResponse } from "@/lib/types/account";

const saveListingOrder = (ids: string[]) =>
  apiClient.put<ListingOrderResponse>("/api/listing-order", { ids } satisfies ListingOrderRequest);

/** 계정의 직접 정렬 순서를 바꾼다. 성공하면 저장된 값으로 캐시를 바꾼다(실패하면 캐시는 그대로다). */
export function useSaveListingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveListingOrder,
    onSuccess: (response) => queryClient.setQueryData(listingOrderQueryKey(), response.ids),
  });
}

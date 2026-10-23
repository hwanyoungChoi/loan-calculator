import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ListingMemoRequest, ListingResponse } from "@/lib/types/account";

type UpdateListingMemoParams = { id: string; memo: string };

const updateListingMemo = ({ id, memo }: UpdateListingMemoParams) =>
  apiClient.patch<ListingResponse>(`/api/listings/${encodeURIComponent(id)}`, {
    memo,
  } satisfies ListingMemoRequest);

/** 메모만 고친다(PATCH, 빈 문자열이면 지움). 다른 기기가 바꾼 가격은 되돌리지 않는다. */
export function useUpdateListingMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListingMemo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

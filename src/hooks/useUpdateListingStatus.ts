import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ListingResponse, ListingStatusRequest } from "@/lib/types/account";
import type { Listing, ListingStatus } from "@/lib/types/listing";

type UpdateListingStatusParams = { id: string; status: ListingStatus | null };

const updateListingStatus = ({ id, status }: UpdateListingStatusParams) =>
  apiClient.patch<ListingResponse>(`/api/listings/${encodeURIComponent(id)}`, {
    status,
  } satisfies ListingStatusRequest);

/** 받아 둔 목록에서 이 매물의 상태만 바꾼다. null이면 키를 지운다(미지정). */
function withStatus(listings: Listing[], { id, status }: UpdateListingStatusParams): Listing[] {
  return listings.map((listing) => {
    if (listing.id !== id) return listing;
    if (status !== null) return { ...listing, status };
    const cleared = { ...listing };
    delete cleared.status;
    return cleared;
  });
}

/**
 * 상태만 고친다(PATCH, null이면 지움). 다른 기기가 바꾼 가격은 되돌리지 않는다(ADR-027).
 * 칩이 바로 바뀌도록 받아 둔 목록에 먼저 반영하고, 실패하면 이전 목록으로 되돌린다.
 */
export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListingStatus,
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: listingListQueryKey() });
      const previous = queryClient.getQueryData<Listing[]>(listingListQueryKey());
      if (previous !== undefined) {
        queryClient.setQueryData(listingListQueryKey(), withStatus(previous, params));
      }
      return { previous };
    },
    onError: (_error, _params, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(listingListQueryKey(), context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

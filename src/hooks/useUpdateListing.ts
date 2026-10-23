import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ListingRequest, ListingResponse } from "@/lib/types/account";
import type { ListingInput } from "@/lib/types/listing";

type UpdateListingParams = { id: string; listing: ListingInput };

const updateListing = ({ id, listing }: UpdateListingParams) =>
  apiClient.put<ListingResponse>(`/api/listings/${encodeURIComponent(id)}`, {
    listing,
  } satisfies ListingRequest);

/** 계산 화면 덮어쓰기(PUT). 서버는 메모를 건드리지 않는다. 목록을 다시 받아 온 뒤에 끝난다. */
export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

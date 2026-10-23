import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ListingRequest, ListingResponse } from "@/lib/types/account";
import type { ListingInput } from "@/lib/types/listing";

const createListing = (listing: ListingInput) =>
  apiClient.post<ListingResponse>("/api/listings", { listing } satisfies ListingRequest);

/** 서버 목록에 새 매물. id·시각은 서버가 정한다. 목록을 다시 받아 온 뒤에 끝난다. */
export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

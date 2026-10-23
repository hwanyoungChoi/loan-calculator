import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ImportListingsRequest, ImportListingsResponse } from "@/lib/types/account";
import type { Listing } from "@/lib/types/listing";

const importListings = (listings: Listing[]) =>
  apiClient.post<ImportListingsResponse>("/api/listings/import", {
    listings,
  } satisfies ImportListingsRequest);

/** id·시각을 붙인 매물을 서버 목록에 넣는다(1~100개). 이미 있는 id는 서버가 건너뛴다(`skipped`). */
export function useImportListings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importListings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

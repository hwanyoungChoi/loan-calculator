import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { listingListQueryKey } from "./useListingList";

import type { ListingNameRequest, ListingResponse } from "@/lib/types/account";

type UpdateListingNameParams = { id: string; name: string };

const updateListingName = ({ id, name }: UpdateListingNameParams) =>
  apiClient.patch<ListingResponse>(`/api/listings/${encodeURIComponent(id)}`, {
    name,
  } satisfies ListingNameRequest);

/**
 * 이름만 고친다(PATCH). 다른 기기가 바꾼 가격·메모·상태는 되돌리지 않는다.
 * 목록을 다시 받은 뒤에 끝나므로 편집칸이 닫힐 때 카드에 새 이름이 보인다.
 */
export function useUpdateListingName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListingName,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingListQueryKey() }),
  });
}

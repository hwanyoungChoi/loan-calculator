import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { isListing } from "@/lib/utils/validateListingFields";

import type { ListingListResponse } from "@/lib/types/account";

export const listingListQueryKey = () => ["listing", "list"] as const;

/** 어긋난 항목이 화면 계산에 들어가지 않게 로컬 저장소와 같은 규칙으로 본다. 하나라도 어긋나면 조회 실패다. */
const fetchListingList = async () => {
  const body = await apiClient.get<Partial<ListingListResponse>>("/api/listings");
  if (!Array.isArray(body.listings) || !body.listings.every(isListing)) {
    throw new Error("/api/listings 응답 형식이 올바르지 않습니다");
  }
  return body.listings;
};

/** 로그인 상태의 저장 목록(서버 원본). 창으로 돌아올 때마다 다시 조회해 다른 기기의 변경을 반영한다. */
export function useListingList({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: listingListQueryKey(),
    queryFn: fetchListingList,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

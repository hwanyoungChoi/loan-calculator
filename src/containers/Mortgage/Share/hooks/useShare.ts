import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { ShareResponse } from "@/lib/types/share";

export const shareQueryKey = (token?: string) =>
  token === undefined ? (["share", "item"] as const) : (["share", "item", token] as const);

const fetchShare = (token: string) => apiClient.get<ShareResponse>(`/api/shares/${token}`);

/**
 * 공유받은 스냅샷. 끊은 링크가 탭 캐시로 열리지 않게 화면을 열 때마다 다시 묻는다(staleTime 0).
 * 카카오톡 등에 다녀와 포커스로 재조회하다 실패하면 보던 목록이 오류 화면으로 바뀌므로 포커스 재조회는 끈다.
 */
export function useShare(token: string, { enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: shareQueryKey(token),
    queryFn: () => fetchShare(token),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

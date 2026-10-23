import { useMutation } from "@tanstack/react-query";

import { apiClient, ApiRequestError } from "@/lib/api/client";

import type { SentShareStore } from "@/lib/types/sentShare";

type RevokeShareParams = { token: string; ownerKey: string };

/** 이미 없는 링크(404: 만료 정리·이미 끊김)는 끊으려던 결과와 같으므로 성공으로 본다. */
async function revokeShare({ token, ownerKey }: RevokeShareParams) {
  try {
    await apiClient.delete(`/api/shares/${token}`, { headers: { "X-Share-Owner-Key": ownerKey } });
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 404)) throw error;
  }
}

/** 공유 링크 끊기. 끊으면 `sent-shares`에서 그 항목을 지운다. */
export function useRevokeShare(sentShareStore: SentShareStore) {
  return useMutation({
    mutationFn: revokeShare,
    onSuccess: (_, { token }) => {
      sentShareStore.remove(token);
    },
  });
}

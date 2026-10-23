import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { SentShareStore } from "@/lib/types/sentShare";
import type { CreateShareRequest, CreateShareResponse } from "@/lib/types/share";

const createShare = (request: CreateShareRequest) =>
  apiClient.post<CreateShareResponse>("/api/shares", request);

/** 공유 링크 만들기. 만들면 끊기 키를 `sent-shares`에 남긴다(다시 받을 수 없는 값). */
export function useCreateShare(sentShareStore: SentShareStore) {
  return useMutation({
    mutationFn: createShare,
    onSuccess: ({ token, expiresAt, ownerKey }, { kind }) => {
      sentShareStore.add({ token, kind, ownerKey, expiresAt });
    },
  });
}

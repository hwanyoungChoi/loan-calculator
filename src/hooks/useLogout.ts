import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { useEndSession } from "./useEndSession";

import type { SessionHintStore } from "@/lib/types/sessionHint";

const logout = () => apiClient.post<void>("/api/auth/logout");

/** 서버 세션을 지우고(204) 이 기기의 로컬 목록으로 돌아간다. */
export function useLogout(sessionHintStore: SessionHintStore) {
  const endSession = useEndSession(sessionHintStore);
  return useMutation({ mutationFn: logout, onSuccess: endSession });
}

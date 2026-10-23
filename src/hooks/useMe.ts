import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { MeResponse } from "@/lib/types/account";

export const meQueryKey = () => ["me", "item"] as const;

function isMeResponse(value: unknown): value is MeResponse {
  if (typeof value !== "object" || value === null) return false;
  const { user } = value as Record<string, unknown>;
  if (user === null) return true;
  return typeof user === "object" && typeof (user as Record<string, unknown>).id === "string";
}

/** 모양이 다른 응답(HTML 등)을 로그아웃으로 읽으면 로그인 사용자의 쓰기가 로컬로 샌다. 실패로 본다. */
const fetchMe = async () => {
  const body = await apiClient.get<unknown>("/api/me");
  if (!isMeResponse(body)) throw new Error("/api/me 응답 형식이 올바르지 않습니다");
  return body;
};

/** 로그인 여부. 창으로 돌아오면 다시 물어 다른 탭의 로그인·로그아웃을 반영한다. */
export function useMe() {
  return useQuery({ queryKey: meQueryKey(), queryFn: fetchMe });
}

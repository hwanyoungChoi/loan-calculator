import { QueryClient } from "@tanstack/react-query";

/** 자동 재시도는 하지 않는다. 일일 호출 한도를 아끼고 오류를 바로 보여 준 뒤 "다시 시도" 버튼에 맡긴다(ADR-014). */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export const queryClient = createQueryClient();

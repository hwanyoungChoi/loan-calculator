import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { budgetQueryKey } from "./useAccountBudget";

import type { BudgetRequest, BudgetResponse } from "@/lib/types/account";

const saveBudget = (budget: number | null) =>
  apiClient.put<BudgetResponse>("/api/budget", { budget } satisfies BudgetRequest);

/** 계정 예산을 바꾼다(null이면 지움). 성공하면 저장된 값으로 캐시를 바꾼다. */
export function useSaveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBudget,
    onSuccess: (response) => queryClient.setQueryData(budgetQueryKey(), response.budget),
  });
}

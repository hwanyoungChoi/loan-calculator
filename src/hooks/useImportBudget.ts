import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { budgetQueryKey } from "./useAccountBudget";

import type { ImportBudgetRequest, ImportBudgetResponse } from "@/lib/types/account";

const importBudget = (budget: number) =>
  apiClient.post<ImportBudgetResponse>("/api/budget/import", {
    budget,
  } satisfies ImportBudgetRequest);

/** 기기 예산을 계정 예산이 비어 있을 때만 올린다. 응답은 계정의 현재 값이라 그대로 캐시에 넣는다. */
export function useImportBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importBudget,
    onSuccess: (response) => queryClient.setQueryData(budgetQueryKey(), response.budget),
  });
}

/** 필요한 자기자금이 예산보다 많은 금액(만원). 예산이 없거나, 계산하지 못했거나(null), 예산 이내면 null. */
export function budgetExcess(ownFunds: number | null, budget: number | null): number | null {
  if (ownFunds === null || budget === null || ownFunds <= budget) return null;
  return ownFunds - budget;
}

/** 예산에서 필요한 자기자금을 빼고 남는 금액(만원). 예산이 없거나, 계산하지 못했거나(null), 예산을 넘으면 null. */
export function budgetLeft(ownFunds: number | null, budget: number | null): number | null {
  if (ownFunds === null || budget === null || ownFunds > budget) return null;
  return budget - ownFunds;
}

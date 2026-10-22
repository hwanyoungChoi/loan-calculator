const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 서버 시각의 KST 달부터 거슬러 올라간 계약년월(YYYYMM) `count`개. 최신 먼저 */
export function recentMonths(now: Date, count: number): string[] {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth();
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - offset, 1));
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

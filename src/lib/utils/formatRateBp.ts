/** bp(0.01%) 정수 → "1.67%", "8%", "0.4%" */
export function formatRateBp(rateBp: number): string {
  return `${rateBp / 100}%`;
}

import type { AptTrade } from "../../src/lib/types/aptTrade";

/** Workers `caches.default`에서 쓰는 부분만. 테스트는 Map 기반 가짜를 넣는다 */
export interface CacheLike {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

const PAST_MONTH_TTL_SECONDS = 24 * 60 * 60;
const CURRENT_MONTH_TTL_SECONDS = 30 * 60;

// 서비스키와 aptName을 넣지 않는다. aptName은 응답 단계 필터라 임의 문자열로 캐시를 우회하지 못한다.
const cacheKey = (lawdCd: string, dealYmd: string) =>
  `https://cache.internal/apt-trades/${lawdCd}/${dealYmd}`;

export async function readMonthCache(
  cache: CacheLike | null,
  lawdCd: string,
  dealYmd: string,
): Promise<AptTrade[] | null> {
  if (cache === null) return null;
  const cached = await cache.match(cacheKey(lawdCd, dealYmd));
  return cached ? ((await cached.json()) as AptTrade[]) : null;
}

/** 성공한 달만 저장한다. TTL은 이번 달 30분, 지난달 이전 24시간 */
export async function writeMonthCache(
  cache: CacheLike | null,
  lawdCd: string,
  dealYmd: string,
  items: AptTrade[],
  isCurrentMonth: boolean,
): Promise<void> {
  if (cache === null) return;
  const maxAge = isCurrentMonth ? CURRENT_MONTH_TTL_SECONDS : PAST_MONTH_TTL_SECONDS;
  await cache.put(
    cacheKey(lawdCd, dealYmd),
    new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` },
    }),
  );
}

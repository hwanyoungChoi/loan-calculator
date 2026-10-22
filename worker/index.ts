import { handleAptTrades } from "../server/aptTrades/handleAptTrades";

// 시크릿은 wrangler.jsonc에 없어서 `wrangler types`로 만들지 않고 손으로 쓴다.
interface Env {
  MOLIT_SERVICE_KEY?: string;
  ASSETS: Fetcher;
}

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === "/api/apt-trades") {
      return handleAptTrades(request, env, {
        fetch,
        now: () => new Date(),
        cache: caches.default,
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

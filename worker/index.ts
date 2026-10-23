import { handleAptTrades } from "../server/aptTrades/handleAptTrades";
import { routeApi } from "../server/http/router";
import { createShare, getShare, revokeShare } from "../server/shares/handleShares";

import type { ApiRoute } from "../server/http/router";

// 시크릿은 wrangler.jsonc에 없어서 `wrangler types`로 만들지 않고 손으로 쓴다.
interface Env {
  MOLIT_SERVICE_KEY?: string;
  DB: D1Database;
  ASSETS: Fetcher;
}

const now = () => new Date();

/** `/api/*` 경로 표. 여기에 없는 `/api/*`는 JSON 404, 메서드가 없으면 405 */
const API_ROUTES: ApiRoute<Env>[] = [
  {
    path: "/api/apt-trades",
    methods: {
      GET: (request, env) => handleAptTrades(request, env, { fetch, now, cache: caches.default }),
    },
  },
  {
    path: "/api/shares",
    methods: { POST: (request, env) => createShare(request, env.DB, now) },
  },
  {
    path: "/api/shares/:token",
    methods: {
      GET: (_request, env, { token }) => getShare(token, env.DB, now),
      DELETE: (request, env, { token }) => revokeShare(request, token, env.DB),
    },
  },
];

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      return routeApi(request, env, API_ROUTES);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

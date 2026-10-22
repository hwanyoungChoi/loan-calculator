import { handleAptTrades } from "../../server/aptTrades/handleAptTrades";

// 시크릿은 wrangler.jsonc에 없어서 `wrangler types`로 만들지 않고 손으로 쓴다.
interface Env {
  MOLIT_SERVICE_KEY?: string;
}

export const onRequest: PagesFunction<Env> = (context) =>
  handleAptTrades(context.request, context.env, {
    fetch,
    now: () => new Date(),
    cache: caches.default,
  });

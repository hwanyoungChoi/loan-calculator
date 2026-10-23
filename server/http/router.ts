import { isSameOrigin } from "./isSameOrigin";
import { errorResponse } from "./response";

export type RouteHandler<Env> = (
  request: Request,
  env: Env,
  params: Record<string, string>,
) => Promise<Response> | Response;

/** `path`의 `:name` 조각은 비어 있지 않은 한 조각에 맞고 `params.name`으로 넘어간다. */
export type ApiRoute<Env> = { path: string; methods: Record<string, RouteHandler<Env>> };

type RouteMatch<Env> = { route: ApiRoute<Env>; params: Record<string, string> };

function matchRoute<Env>(routes: ApiRoute<Env>[], pathname: string): RouteMatch<Env> | null {
  const segments = pathname.split("/");
  for (const route of routes) {
    const patternSegments = route.path.split("/");
    if (patternSegments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    const isMatch = patternSegments.every((pattern, index) => {
      const segment = segments[index];
      if (!pattern.startsWith(":")) return pattern === segment;
      params[pattern.slice(1)] = segment;
      return segment !== "";
    });
    if (isMatch) return { route, params };
  }
  return null;
}

/**
 * `/api/*` 요청을 경로 표로 나눈다. 표에 없는 경로는 404(ASSETS로 넘기지 않음),
 * 메서드가 틀리면 405 + `Allow`, GET/HEAD가 아닌데 Origin이 다르면 403, 처리 중 예외는 500.
 */
export async function routeApi<Env>(
  request: Request,
  env: Env,
  routes: ApiRoute<Env>[],
): Promise<Response> {
  const match = matchRoute(routes, new URL(request.url).pathname);
  if (match === null) return errorResponse(404, "notFound", "없는 API 경로입니다");

  const { methods } = match.route;
  if (!Object.hasOwn(methods, request.method)) {
    const allow = Object.keys(methods).join(", ");
    return errorResponse(405, "methodNotAllowed", `${allow}만 허용합니다`, { Allow: allow });
  }
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    return errorResponse(403, "forbidden", "다른 출처의 요청은 받지 않습니다");
  }

  try {
    return await methods[request.method](request, env, match.params);
  } catch (error) {
    // 예외 message에는 토큰·키가 섞일 수 있어 이름만 남긴다.
    // eslint-disable-next-line no-console
    console.error("api internal error", error instanceof Error ? error.name : typeof error);
    return errorResponse(500, "internal", "서버 오류가 발생했습니다");
  }
}

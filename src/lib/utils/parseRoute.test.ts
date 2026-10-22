import { describe, expect, it } from "vitest";

import { PATHS } from "@/lib/constants/paths";

import { parseRoute, toRoutePath } from "./parseRoute";

import type { Route } from "@/lib/types/route";

describe("parseRoute 라우트 규칙표 (AC-8c)", () => {
  const cases: [string, Route][] = [
    ["", { name: "calculator" }],
    ["#", { name: "calculator" }],
    ["#/", { name: "calculator" }],
    ["#/listings", { name: "listings", sort: "ownFunds", view: "card" }],
    ["#/listings?sort=recent", { name: "listings", sort: "recent", view: "card" }],
    ["#/listings?sort=ownFunds", { name: "listings", sort: "ownFunds", view: "card" }],
    ["#/listings?sort=name", { name: "listings", sort: "name", view: "card" }],
    ["#/listings?sort=foo", { name: "listings", sort: "ownFunds", view: "card" }],
    ["#/listings?sort=", { name: "listings", sort: "ownFunds", view: "card" }],
    ["#/listings?sort=RECENT", { name: "listings", sort: "ownFunds", view: "card" }],
    ["#/listings?other=1", { name: "listings", sort: "ownFunds", view: "card" }],
    // 알 수 없는 해시
    ["#/listing/abc", { name: "calculator" }],
    ["#/x", { name: "calculator" }],
    ["#listings", { name: "calculator" }],
    ["#/calculator", { name: "calculator" }],
  ];

  it.each(cases)("%j → %j", (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });
});

describe("toRoutePath 정규 경로", () => {
  it("라우트별 정규 경로는 PATHS와 같다", () => {
    expect(toRoutePath({ name: "calculator" })).toBe("#/");
    expect(toRoutePath({ name: "listings", sort: "ownFunds", view: "card" })).toBe("#/listings");
    expect(toRoutePath({ name: "listings", sort: "recent", view: "card" })).toBe(
      "#/listings?sort=recent",
    );
    expect(PATHS.calculator).toBe("#/");
    expect(PATHS.listings()).toBe("#/listings");
    expect(PATHS.listings("recent")).toBe("#/listings?sort=recent");
  });

  // useHashRoute는 현재 해시와 이 값이 다르면 replace한다.
  it.each([
    ["#/listing/abc", "#/"],
    ["#/x", "#/"],
    ["", "#/"],
    ["#/listings?sort=foo", "#/listings"],
  ])("알 수 없는 해시 %j의 정규 경로는 %j다", (hash, canonical) => {
    expect(toRoutePath(parseRoute(hash))).toBe(canonical);
  });

  it.each(["#/", "#/listings", "#/listings?sort=recent"])(
    "정규 경로 %j는 다시 파싱해도 같은 경로다(replace 루프 없음)",
    (hash) => {
      expect(toRoutePath(parseRoute(hash))).toBe(hash);
    },
  );
});

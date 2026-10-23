import {
  DEFAULT_LISTINGS_VIEW,
  DEFAULT_SORT_ORDER,
  LISTING_SORT_ORDERS,
  LISTING_SORTS,
  LISTING_VIEWS,
} from "@/lib/constants/listingsView";

import { isOneOf } from "./isOneOf";

import type { ListingsViewState, ListingsViewStore } from "@/lib/types/listingsView";

/** 새 키(기존 키는 건드리지 않는다, AC-0) */
export const LISTINGS_VIEW_STORAGE_KEY = "loan-calculator/listings-view";

/**
 * 원문 → 기억. 키 없음·JSON 아님·객체 아님은 전부 기본값이고, 필드는 허용 목록으로 따로 읽어 틀린 필드만 기본값이다.
 * 방향이 틀리면 읽은 정렬의 기본 방향이다.
 */
export function parseListingsView(raw: string | null): ListingsViewState {
  if (raw === null) return DEFAULT_LISTINGS_VIEW;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_LISTINGS_VIEW;
  }
  if (typeof value !== "object" || value === null) return DEFAULT_LISTINGS_VIEW;
  const { sort, order, view } = value as Record<string, unknown>;
  const parsedSort = isOneOf(LISTING_SORTS, sort) ? sort : DEFAULT_LISTINGS_VIEW.sort;
  return {
    sort: parsedSort,
    order: isOneOf(LISTING_SORT_ORDERS, order) ? order : DEFAULT_SORT_ORDER[parsedSort],
    view: isOneOf(LISTING_VIEWS, view) ? view : DEFAULT_LISTINGS_VIEW.view,
  };
}

function loadListingsView(storage: Storage): ListingsViewState {
  try {
    return parseListingsView(storage.getItem(LISTINGS_VIEW_STORAGE_KEY));
  } catch {
    return DEFAULT_LISTINGS_VIEW;
  }
}

/** 메모리 상태가 원본이고 storage에는 최선으로 기록한다(접근 불가면 이 탭에서만 유지). */
export function createListingsViewStore({ storage }: { storage: Storage }): ListingsViewStore {
  const listeners = new Set<() => void>();
  let state = loadListingsView(storage);

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      state = next;
      try {
        storage.setItem(LISTINGS_VIEW_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 접근 불가·용량 초과: 이 탭에서만 유지한다.
      }
      for (const listener of listeners) listener();
    },
  };
}

import type { Borrower, Region } from "./regulation";
import type { StorageWriteResult } from "./storage";

export type Listing = {
  id: string;
  name: string;
  salePrice: number;
  kbPrice: number;
  region: Region;
  borrower: Borrower;
  /** 0~100 정수. 키가 없으면 규제 LTV다. 규제로 저장할 때는 키를 쓰지 않는다(ADR-012). */
  customLtvRate?: number;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
};

/** add/update에 넘기는 값. id와 시각은 스토어가 채운다. */
export type ListingInput = Pick<
  Listing,
  "name" | "salePrice" | "kbPrice" | "region" | "borrower" | "customLtvRate"
>;

export type ListingSort = "ownFunds" | "recent";

export type LoadListingsResult =
  | { ok: true; listings: Listing[] }
  | { ok: false; reason: "corrupt"; rawText: string }
  | { ok: false; reason: "unavailable" };

export type ListingSnapshot =
  | { status: "ok"; listings: Listing[] }
  | { status: "corrupt"; rawText: string }
  | { status: "unavailable" };

export type ListingWriteFailure = { ok: false; reason: "corrupt" | "unavailable" | "notFound" };

export type ListingWriteResult = { ok: true } | ListingWriteFailure;

export type ListingStore = {
  getSnapshot: () => ListingSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** 다른 탭의 `storage` 이벤트처럼 외부에서 바뀌었을 때 구독자에게 알린다. */
  notify: () => void;
  add: (input: ListingInput) => { ok: true; listing: Listing } | ListingWriteFailure;
  update: (id: string, input: ListingInput) => ListingWriteResult;
  remove: (id: string) => ListingWriteResult;
  reset: () => StorageWriteResult;
};

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
  /** 전용 85㎡ 초과일 때만 키를 쓴다. 키 없음 = 85㎡ 이하(ADR-022, ADR-012 규칙). */
  isAreaOver85?: true;
  /** 1~500자(코드포인트). 메모가 없으면 키를 쓰지 않는다(ADR-012 규칙). */
  memo?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
};

/** add/update에 넘기는 값. id와 시각은 스토어가 채운다. */
export type ListingInput = Pick<
  Listing,
  "name" | "salePrice" | "kbPrice" | "region" | "borrower" | "customLtvRate" | "isAreaOver85"
> & {
  /** 키가 있으면 메모를 이 값으로 바꾸고(빈 문자열이면 지움), 키가 없으면 덮어쓰기에서도 기존 메모를 둔다. */
  memo?: string;
};

export type ListingSort = "ownFunds" | "recent" | "name";

/** 목록 보기: card는 카드, compact는 이름과 필요한 자기자금만 한 줄씩 */
export type ListingView = "card" | "compact";

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
  /** 여러 개를 새 id로 한 번에 추가한다(공유받기). 전부 들어가거나 하나도 안 들어간다. */
  addMany: (inputs: ListingInput[]) => { ok: true; listings: Listing[] } | ListingWriteFailure;
  update: (id: string, input: ListingInput) => ListingWriteResult;
  remove: (id: string) => ListingWriteResult;
  reset: () => StorageWriteResult;
};

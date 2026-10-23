import { useCallback, useEffect, useRef, useState } from "react";

import { ApiRequestError } from "@/lib/api/client";
import { toListingFields } from "@/lib/utils/listingStore";

import { useImportListings } from "./useImportListings";
import { useMe } from "./useMe";

import type { ImportListingsResponse } from "@/lib/types/account";
import type {
  AccountImportFailureReason,
  AccountImportResult,
  AccountImportState,
  AccountImportStore,
} from "@/lib/types/accountImport";
import type { Listing, ListingSnapshot, ListingStore } from "@/lib/types/listing";

/**
 * `/api/listings/import` 한 요청의 개수(서버 계약 1~100개, 본문 512KB = 524,288바이트).
 * 개수가 아니라 크기가 먼저 찬다. 매물 하나(import 항목)는 최악 10,628바이트다: 추가 비용 30줄 × (55 + 이름 30자 × 6바이트)
 * + 키·대괄호 16 = 7,065, 기존 필드(이름 40자·메모 500자를 6바이트로) 3,403, id·시각 160(스펙 extra-costs "크기 상한 계산").
 * 40개 × 10,628 = 425,120바이트(+ 봉투)라 약 97KB 여유가 있다. 49개까지 들어가고 50개는 넘으며, 100개는 한글만으로도 넘는다.
 * 추가 비용 상한(`EXTRA_COST_MAX_ITEMS`·이름 길이)이나 메모·이름 상한을 올리면 다시 계산한다(ADR-024 D4).
 */
const IMPORT_BATCH_SIZE = 40;

export type AccountImport = {
  /** 아직 이 사용자의 이전을 시작하지 않았으면 null */
  state: AccountImportState | null;
  /** 실패한 이전을 다시 한다. 이미 옮긴 id는 기록에 있어 보내지 않는다. */
  retry: () => void;
};

/** 이 사용자의 이전이 끝났거나 건너뛰기로 정해졌다. 그 전까지 서버 목록을 조회하지 않는다(빈 목록 깜빡임 방지). */
export function isAccountImportSettled(state: AccountImportState | null, userId: string): boolean {
  return state !== null && state.userId === userId && state.status !== "running";
}

/** 400은 계정 500개 상한이다(필드는 로컬 저장소가 같은 검증 함수로 이미 본 값). 나머지는 연결·서버 오류. */
function toFailureReason(error: unknown): AccountImportFailureReason {
  return error instanceof ApiRequestError && error.status === 400 ? "limit" : "network";
}

function toBatches(listings: Listing[]): Listing[][] {
  const batches: Listing[][] = [];
  for (let start = 0; start < listings.length; start += IMPORT_BATCH_SIZE) {
    batches.push(listings.slice(start, start + IMPORT_BATCH_SIZE));
  }
  return batches;
}

type ImportLocalListingsOptions = {
  userId: string;
  snapshot: ListingSnapshot;
  accountImportStore: AccountImportStore;
  send: (listings: Listing[]) => Promise<ImportListingsResponse>;
  confirm: (message: string) => boolean;
};

/**
 * 이 기기의 로컬 매물 중 이 계정으로 아직 옮기지 않은 것을 40개 단위로 보낸다.
 * 로컬 목록은 읽기만 한다(AC-0). 요청이 성공할 때마다 그 id를 기록해, 서버에서 지운 매물이 다시 로그인할 때 되살아나지 않는다.
 * 이 기기에 다른 계정의 기록이 있고 이 계정은 처음이면 한 번 묻는다(한 기기를 둘이 쓰는 경우, 스펙 U6).
 */
async function importLocalListings({
  userId,
  snapshot,
  accountImportStore,
  send,
  confirm,
}: ImportLocalListingsOptions): Promise<AccountImportResult> {
  if (snapshot.status !== "ok") return { status: "skipped", reason: snapshot.status };
  const imports = accountImportStore.read();
  const importedIds = new Set(imports[userId] ?? []);
  const pending = snapshot.listings.filter((listing) => !importedIds.has(listing.id));
  if (pending.length === 0) return { status: "done", importedCount: 0 };

  const hasOtherAccount = Object.keys(imports).some((id) => id !== userId);
  if (hasOtherAccount && !Object.hasOwn(imports, userId)) {
    const pendingIds = pending.map((listing) => listing.id);
    if (!confirm(`이 기기의 매물 ${pending.length}개를 내 계정으로 옮길까요?`)) {
      // 옮기지 않기로 한 매물도 기록해 다시 묻지 않는다(영구 제외, 스펙 A15).
      accountImportStore.add(userId, pendingIds);
      return { status: "done", importedCount: 0 };
    }
    // 기록 키를 먼저 만들어, 이번에 실패해 다시 시도할 때 또 묻지 않는다.
    accountImportStore.add(userId, []);
  }

  let importedCount = 0;
  let sentCount = 0;
  for (const batch of toBatches(pending)) {
    try {
      const response = await send(
        batch.map(({ id, createdAt, updatedAt, ...fields }) => ({
          id,
          ...toListingFields(fields),
          createdAt,
          updatedAt,
        })),
      );
      importedCount += response.imported;
    } catch (error) {
      return {
        status: "failed",
        reason: toFailureReason(error),
        failedCount: pending.length - sentCount,
      };
    }
    sentCount += batch.length;
    accountImportStore.add(
      userId,
      batch.map((listing) => listing.id),
    );
  }
  return { status: "done", importedCount };
}

type AccountImportOptions = {
  /** 로그아웃 상태의 목록 원본. 읽기만 한다. */
  listingStore: ListingStore;
  accountImportStore: AccountImportStore;
  /** 실제로 옮긴 매물이 있을 때 한 번 부른다. 바뀌지 않는 함수를 넘긴다(useCallback). */
  onImported: (importedCount: number) => void;
};

/**
 * 로그인 확인 직후 이 기기의 로컬 매물을 계정으로 옮긴다. 앱에서 한 번만 부른다(`AppRoutes`).
 * 화면을 오가도 결과가 남고, 실행 중에는 다시 시작하지 않는다.
 */
export function useAccountImport({
  listingStore,
  accountImportStore,
  onImported,
}: AccountImportOptions): AccountImport {
  const me = useMe();
  const userId = me.data?.user?.id ?? null;
  const { mutateAsync: sendImport } = useImportListings();
  const [state, setState] = useState<AccountImportState | null>(null);
  const isRunningRef = useRef(false);

  const run = useCallback(
    async (targetUserId: string) => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      setState({ userId: targetUserId, status: "running" });
      const result = await importLocalListings({
        userId: targetUserId,
        snapshot: listingStore.getSnapshot(),
        accountImportStore,
        send: sendImport,
        confirm: (message) => window.confirm(message),
      });
      isRunningRef.current = false;
      setState({ userId: targetUserId, ...result });
      if (result.status === "done" && result.importedCount > 0) {
        onImported(result.importedCount);
      }
    },
    [listingStore, accountImportStore, sendImport, onImported],
  );

  useEffect(() => {
    if (userId === null || state?.userId === userId) return;
    void run(userId);
  }, [userId, state, run]);

  return {
    state,
    retry: () => {
      if (userId !== null) void run(userId);
    },
  };
}

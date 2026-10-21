import { useSyncExternalStore } from "react";

import type { Draft, DraftStore } from "@/lib/types/draft";

/** 계산 화면의 작성 중 입력을 구독한다. 바꾸기는 `store.update`로 한다. */
export function useDraft(store: DraftStore): Draft {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

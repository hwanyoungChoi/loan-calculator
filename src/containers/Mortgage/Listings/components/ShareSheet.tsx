import { useState } from "react";

import Sheet from "@/components/Sheet";
import { ApiRequestError } from "@/lib/api/client";
import { SHARE_MAX_LISTINGS } from "@/lib/constants/share";

import ShareLinkResult from "./ShareLinkResult";
import styles from "./ShareSheet.module.css";
import { useCreateShare } from "../hooks/useCreateShare";
import { hasMemo, toShareListing } from "../toShareListing";

import type { Listing } from "@/lib/types/listing";
import type { SentShareStore } from "@/lib/types/sentShare";
import type { ShareKind } from "@/lib/types/share";

/** 시트를 연 시점의 매물(스냅샷). listing이면 1개, list면 저장 목록 전체 */
export type ShareTarget = { kind: ShareKind; listings: Listing[] };

type ShareSheetProps = {
  target: ShareTarget;
  sentShareStore: SentShareStore;
  onClose: () => void;
};

const TITLES: Record<ShareKind, (listings: Listing[]) => string> = {
  listing: (listings) => `'${listings[0].name}' 공유`,
  list: (listings) => `저장 목록 공유 (${listings.length}개)`,
};

const MEMO_HINT_ID = "share-memo-hint";

/** 서버가 이유를 보냈으면 그대로, 아니면(연결 실패 등) 연결 확인 안내 */
function describeCreateError(error: Error): string {
  return error instanceof ApiRequestError && error.body !== null
    ? `링크를 만들지 못했습니다(${error.body.message})`
    : "링크를 만들지 못했습니다. 연결을 확인하고 다시 시도해 주세요";
}

/**
 * 공유 시트: 링크 만들기 → 복사·공유하기·끊기. 닫았다 다시 열면 새로 만들기부터다(시트가 새로 그려진다).
 * 링크는 만든 시점의 값만 담는다(이후 고쳐도 링크 내용은 그대로).
 */
function ShareSheet({ target, sentShareStore, onClose }: ShareSheetProps) {
  const { kind, listings } = target;
  const createShare = useCreateShare(sentShareStore);
  const [includeMemo, setIncludeMemo] = useState(false);

  const isOverLimit = listings.length > SHARE_MAX_LISTINGS;
  const canIncludeMemo = listings.some(hasMemo);

  const handleCreate = () => {
    createShare.mutate({
      kind,
      listings: listings.map((listing) => toShareListing(listing, includeMemo)),
    });
  };

  const renderBody = () => {
    if (createShare.data !== undefined) {
      return <ShareLinkResult share={createShare.data} sentShareStore={sentShareStore} />;
    }
    if (isOverLimit) {
      return <p className={styles.notice}>한 번에 {SHARE_MAX_LISTINGS}개까지 공유할 수 있습니다</p>;
    }
    return (
      <>
        {canIncludeMemo && (
          <div className={styles.field}>
            <label className={styles.switchRow}>
              <span>메모 함께 보내기</span>
              <input
                className={styles.switch}
                type="checkbox"
                role="switch"
                checked={includeMemo}
                disabled={createShare.isPending}
                aria-describedby={MEMO_HINT_ID}
                onChange={(event) => setIncludeMemo(event.target.checked)}
              />
            </label>
            <p id={MEMO_HINT_ID} className={styles.hint}>
              끄면 메모 없이 매물 값만 보냅니다
            </p>
          </div>
        )}
        {createShare.isError && (
          <p role="alert" className={styles.error}>
            {describeCreateError(createShare.error)}
          </p>
        )}
        <button
          type="button"
          className={styles.primaryButton}
          disabled={createShare.isPending}
          onClick={handleCreate}
        >
          {createShare.isPending
            ? "링크를 만드는 중"
            : createShare.isError
              ? "다시 시도"
              : "링크 만들기"}
        </button>
      </>
    );
  };

  return (
    <Sheet title={TITLES[kind](listings)} onClose={onClose}>
      <div className={styles.body}>{renderBody()}</div>
    </Sheet>
  );
}

export default ShareSheet;

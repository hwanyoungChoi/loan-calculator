import { useState } from "react";

import styles from "./ShareSheet.module.css";
import { useRevokeShare } from "../hooks/useRevokeShare";

import type { SentShareStore } from "@/lib/types/sentShare";
import type { CreateShareResponse } from "@/lib/types/share";

type ShareLinkResultProps = {
  share: CreateShareResponse;
  sentShareStore: SentShareStore;
};

const REVOKE_CONFIRM_MESSAGE = "이 링크를 끊을까요? 이미 받은 사람도 더 이상 열 수 없습니다.";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * 만든 링크. 입력칸은 포커스하면 전체 선택되어 직접 복사할 수 있다(비보안 주소에는 clipboard가 없다).
 * 끊은 뒤에는 링크·복사·공유하기를 모두 없애 끊긴 링크를 보내지 않게 한다. 닫기는 시트 머리글에 있다.
 */
function ShareLinkResult({ share, sentShareStore }: ShareLinkResultProps) {
  const revokeShare = useRevokeShare(sentShareStore);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const canCopy = "clipboard" in navigator;
  const canShare = "share" in navigator;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
      setLinkMessage("복사했습니다");
    } catch {
      setLinkMessage("복사하지 못했습니다. 링크를 길게 눌러 직접 복사하세요");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: "모기지핏 매물 공유", url: share.url });
    } catch (error) {
      // 사용자가 공유 창을 닫은 것은 오류가 아니다.
      if (!isAbortError(error)) setLinkMessage("공유하지 못했습니다. 링크를 복사해 보내 주세요");
    }
  };

  const handleRevoke = () => {
    if (!window.confirm(REVOKE_CONFIRM_MESSAGE)) return;
    revokeShare.mutate({ token: share.token, ownerKey: share.ownerKey });
  };

  if (revokeShare.isSuccess) {
    return (
      <p role="status" className={styles.notice}>
        링크를 끊었습니다. 이 링크는 더 이상 열리지 않습니다
      </p>
    );
  }

  return (
    <>
      <input
        className={styles.linkInput}
        type="text"
        readOnly
        aria-label="공유 링크"
        value={share.url}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
      />
      {(canCopy || canShare) && (
        <div className={styles.actions}>
          {canCopy && (
            <button type="button" className={styles.secondaryButton} onClick={handleCopy}>
              복사
            </button>
          )}
          {canShare && (
            <button type="button" className={styles.primaryButton} onClick={handleShare}>
              공유하기
            </button>
          )}
        </div>
      )}
      <div role="status" className={styles.status}>
        {linkMessage}
      </div>
      <p className={styles.hint}>
        30일 동안 열 수 있습니다. 받은 사람 목록에 복사본으로 들어가며, 이후 내가 고쳐도 바뀌지
        않습니다.
      </p>
      {revokeShare.isError && (
        <p role="alert" className={styles.error}>
          링크를 끊지 못했습니다. 연결을 확인하고 다시 시도해 주세요
        </p>
      )}
      <button
        type="button"
        className={styles.dangerButton}
        disabled={revokeShare.isPending}
        onClick={handleRevoke}
      >
        {revokeShare.isPending ? "링크를 끊는 중" : "이 링크 끊기"}
      </button>
    </>
  );
}

export default ShareLinkResult;

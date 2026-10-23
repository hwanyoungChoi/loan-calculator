import KakaoLoginLink from "@/components/KakaoLoginLink";
import { useLogout } from "@/hooks/useLogout";

import styles from "./AccountBar.module.css";

import type { ListingSourceStatus } from "@/lib/types/listing";
import type { LoginResult } from "@/lib/types/route";
import type { SessionHintStore } from "@/lib/types/sessionHint";
import type { ReactNode } from "react";

type AccountBarProps = {
  status: ListingSourceStatus;
  /** 로그인에서 돌아온 결과. 들어올 때 한 번 잡은 값이다(주소에서는 이미 지운다). */
  loginResult: LoginResult | undefined;
  isSessionExpired: boolean;
  sessionHintStore: SessionHintStore;
  onRetry: () => void;
  isRetrying: boolean;
};

const LOGIN_RESULT_MESSAGES: Record<LoginResult, string> = {
  cancelled: "로그인을 취소했습니다",
  failed: "로그인하지 못했습니다. 다시 시도해 주세요",
  notConfigured: "로그인을 준비 중입니다",
};

const SESSION_EXPIRED_MESSAGE = "로그인이 끝났습니다. 다시 로그인해 주세요";

/**
 * 저장 목록 머리글 아래 계정 줄: 목록이 어디에 저장되는지와 로그인·로그아웃.
 * 누구의 계정인지는 보이지 않는다(회원번호만 저장, 스펙 A16).
 */
function AccountBar({
  status,
  loginResult,
  isSessionExpired,
  sessionHintStore,
  onRetry,
  isRetrying,
}: AccountBarProps) {
  const logout = useLogout(sessionHintStore);
  const notice = isSessionExpired
    ? SESSION_EXPIRED_MESSAGE
    : loginResult === undefined
      ? null
      : LOGIN_RESULT_MESSAGES[loginResult];

  const rows: Record<ListingSourceStatus, () => ReactNode> = {
    loading: () => (
      <div className={styles.row}>
        <p className={styles.mutedText}>계정을 확인하는 중</p>
      </div>
    ),
    loggedOut: () => (
      <div className={styles.row}>
        <p className={styles.text}>이 기기에만 저장됩니다</p>
        <KakaoLoginLink />
      </div>
    ),
    loggedIn: () => (
      <>
        <div className={styles.row}>
          <p className={styles.text}>카카오 계정에 저장 중</p>
          <button
            type="button"
            className={styles.button}
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            로그아웃
          </button>
        </div>
        <p className={styles.subText}>로그아웃하면 이 기기에 있던 목록으로 돌아갑니다</p>
        {logout.isError && (
          <p role="alert" className={styles.error}>
            로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요
          </p>
        )}
      </>
    ),
    error: () => (
      <div className={styles.row}>
        <p role="alert" className={styles.errorText}>
          계정 상태를 확인하지 못했습니다
        </p>
        <button type="button" className={styles.button} disabled={isRetrying} onClick={onRetry}>
          다시 시도
        </button>
      </div>
    ),
  };

  return (
    <section className={styles.bar} aria-label="계정" aria-busy={status === "loading"}>
      {rows[status]()}
      {notice !== null && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
    </section>
  );
}

export default AccountBar;

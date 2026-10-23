import { useState } from "react";

import { useListings } from "@/hooks/useListings";
import { ApiRequestError } from "@/lib/api/client";
import { PATHS } from "@/lib/constants/paths";
import { SHARE_TOKEN_PATTERN } from "@/lib/constants/share";

import styles from "./MortgageShare.module.css";
import SharePanel from "./components/SharePanel";
import SharedListingRow from "./components/SharedListingRow";
import { useShare } from "./hooks/useShare";
import { parseShareResponse, type SharedListings } from "./parseShareResponse";

import type { ListingStore, ListingWriteFailure } from "@/lib/types/listing";
import type { Regulations } from "@/lib/types/regulation";
import type { ShareKind } from "@/lib/types/share";

type MortgageShareProps = {
  /** 주소의 토큰 그대로(모양 검사 전) */
  token: string;
  listingStore: ListingStore;
  regulations: Regulations;
  /** 추가에 성공하면 저장 목록에 보일 알림과 함께 부른다. 이동은 부르는 쪽이 replace로 한다. */
  onAdded: (notice: string) => void;
};

const TITLES: Record<ShareKind, (count: number) => string> = {
  listing: (count) => `공유받은 매물 ${count}개`,
  list: (count) => `공유받은 저장 목록 (${count}개)`,
};

/** 추가할 수 없는 이유. 목록 상태(손상·접근 불가)와 쓰기 실패가 같은 문구를 쓴다. */
const ADD_FAILURE_MESSAGES: Record<ListingWriteFailure["reason"], string> = {
  corrupt: "저장된 목록이 손상되어 추가할 수 없습니다(저장 목록 화면에서 초기화)",
  unavailable: "이 브라우저에서는 저장소를 사용할 수 없어 저장 목록을 쓸 수 없습니다",
  notFound: "추가하지 못했습니다. 다시 시도해 주세요",
};

const ADD_BLOCKED_ID = "share-add-blocked";

/** 만료(410)와 끊김·없음(404)은 받는 사람에게 같은 상황이다. */
function isShareGone(error: Error): boolean {
  return error instanceof ApiRequestError && (error.status === 404 || error.status === 410);
}

/**
 * 공유받기 `#/share/{token}`. 응답을 다시 검증한 뒤에만 보이고, [내 목록에 추가]하면 새 id의 사본으로 넣는다.
 * 보낸 사람이 나중에 고치거나 지워도 받은 목록은 바뀌지 않는다.
 */
function MortgageShare({ token, listingStore, regulations, onAdded }: MortgageShareProps) {
  const isTokenValid = SHARE_TOKEN_PATTERN.test(token);
  const share = useShare(token, { enabled: isTokenValid });

  const renderBody = () => {
    // 모양이 틀린 토큰은 묻지 않고 사라진 링크와 같은 화면이다.
    if (!isTokenValid || (share.isError && isShareGone(share.error))) {
      return (
        <SharePanel
          title="만료되었거나 끊긴 링크입니다"
          description="보낸 사람에게 새 링크를 받아 주세요"
        >
          <a className={styles.primaryLink} href={PATHS.calculator}>
            계산기로 가기
          </a>
        </SharePanel>
      );
    }
    if (share.isPending) return <SharePanel title="공유받은 매물을 불러오는 중" />;
    if (share.isError) {
      return (
        <SharePanel title="불러오지 못했습니다" description="연결을 확인하고 다시 시도해 주세요">
          <button
            type="button"
            className={styles.primaryButton}
            disabled={share.isFetching}
            onClick={() => void share.refetch()}
          >
            다시 시도
          </button>
        </SharePanel>
      );
    }
    const shared = parseShareResponse(share.data);
    if (shared === null) {
      return (
        <SharePanel
          title="불러오지 못했습니다"
          description="공유받은 매물의 값이 올바르지 않습니다. 보낸 사람에게 새 링크를 받아 주세요"
        >
          <a className={styles.primaryLink} href={PATHS.calculator}>
            계산기로 가기
          </a>
        </SharePanel>
      );
    }
    return (
      <SharedListingsView
        shared={shared}
        listingStore={listingStore}
        regulations={regulations}
        onAdded={onAdded}
      />
    );
  };

  return <div className={styles.page}>{renderBody()}</div>;
}

type SharedListingsViewProps = Omit<MortgageShareProps, "token"> & { shared: SharedListings };

function SharedListingsView({
  shared,
  listingStore,
  regulations,
  onAdded,
}: SharedListingsViewProps) {
  const snapshot = useListings(listingStore);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { kind, listings } = shared;
  const blockedReason = snapshot.status === "ok" ? null : ADD_FAILURE_MESSAGES[snapshot.status];

  // 두 번 눌러 두 벌 들어가지 않게 누르는 동안 막는다. 성공하면 이 화면을 떠난다.
  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    const result = listingStore.addMany(listings);
    if (result.ok) {
      onAdded(`${result.listings.length}개를 내 목록에 추가했습니다`);
      return;
    }
    setAddError(ADD_FAILURE_MESSAGES[result.reason]);
    setIsAdding(false);
  };

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{TITLES[kind](listings.length)}</h1>
        <p className={styles.description}>
          내 목록에 복사본으로 추가됩니다. 보낸 사람이 나중에 고쳐도 내 목록은 바뀌지 않아요.
        </p>
        <p className={styles.baseDate}>
          규제 기준일 {regulations.baseDate} · 현재 규제로 다시 계산한 값입니다
        </p>
      </header>
      <ul className={styles.list} aria-label={`공유받은 매물 ${listings.length}개`}>
        {listings.map((listing, index) => (
          // 공유 스냅샷에는 id가 없고 순서가 바뀌지 않는다.
          <SharedListingRow key={index} listing={listing} regulations={regulations} />
        ))}
      </ul>
      <div className={styles.actions}>
        {blockedReason !== null && (
          <p id={ADD_BLOCKED_ID} className={styles.error}>
            {blockedReason}
          </p>
        )}
        {addError !== null && (
          <p role="alert" className={styles.error}>
            {addError}
          </p>
        )}
        <button
          type="button"
          className={styles.primaryButton}
          disabled={blockedReason !== null || isAdding}
          aria-describedby={blockedReason === null ? undefined : ADD_BLOCKED_ID}
          onClick={handleAdd}
        >
          내 목록에 추가 ({listings.length}개)
        </button>
        <p className={styles.hint}>
          이 브라우저에만 저장됩니다. 카카오톡 안에서 열었다면 다른 브라우저에서는 보이지 않을 수
          있어요.
        </p>
        <a className={styles.secondaryLink} href={PATHS.calculator}>
          취소
        </a>
      </div>
    </>
  );
}

export default MortgageShare;

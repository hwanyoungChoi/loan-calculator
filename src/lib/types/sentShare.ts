import type { ShareKind } from "./share";

/** 내가 만든 공유 링크와 끊기 키. 다음 단계 "보낸 링크 목록"에서 나중에 끊을 때 쓴다. */
export type SentShare = {
  token: string;
  kind: ShareKind;
  /** DELETE의 `X-Share-Owner-Key` 값. 서버에서 다시 받을 수 없다. */
  ownerKey: string;
  /** ISO 8601 */
  expiresAt: string;
};

export type SentShareStore = {
  add: (share: SentShare) => void;
  remove: (token: string) => void;
};

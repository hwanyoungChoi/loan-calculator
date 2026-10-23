import type { ShareKind } from "@/lib/types/share";

export const SHARE_KINDS: readonly ShareKind[] = ["listing", "list"];

/** 링크 하나에 담는 매물 상한. 서버(`server/shares/parseShareRequest.ts`)와 같은 값이다. */
export const SHARE_MAX_LISTINGS = 100;

/** 공유 토큰 모양: 16바이트 base64url(22자). 대소문자를 구분한다. */
export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

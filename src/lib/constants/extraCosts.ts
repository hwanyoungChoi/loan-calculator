// 추가 비용 분류와 상한(ADR-024). 공유 검증(server/)의 전이 의존이라 `@/` 별칭·DOM 타입을 쓰지 않는다.
// 금액 범위는 매매가와 같다(1~MAX_AMOUNT, `utils/amount.ts`). 추천 항목은 화면 전용이라 여기 두지 않는다.
import type { ExtraCostCategory } from "../types/extraCost";

/** 화면에 보이는 순서 */
export const EXTRA_COST_CATEGORIES: ExtraCostCategory[] = [
  "interior",
  "appliance",
  "furniture",
  "moving",
  "other",
];

export const EXTRA_COST_CATEGORY_LABELS: Record<ExtraCostCategory, string> = {
  interior: "인테리어",
  appliance: "가전",
  furniture: "가구",
  moving: "이사",
  other: "기타",
};

/**
 * 매물당 줄 수 상한. 이 값·항목 이름 상한을 올리면 로그인 이전 배치(40개)와 공유 128KB의
 * 크기 계산(스펙 extra-costs "크기 상한 계산")을 다시 해야 한다.
 */
export const EXTRA_COST_MAX_ITEMS = 30;

/** 항목 이름 상한(코드포인트) */
export const EXTRA_COST_LABEL_MAX_LENGTH = 30;

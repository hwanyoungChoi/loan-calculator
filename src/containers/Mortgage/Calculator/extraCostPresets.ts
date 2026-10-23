import type { ExtraCostCategory } from "@/lib/types/extraCost";

/**
 * 분류별 추천 항목(스펙 U3 제안 기본값). 누르면 이름이 채워진 줄이 생긴다. 화면 전용이라 저장 검증과 무관하다.
 * 인테리어 항목은 토스피드 "집 살 때 인테리어 체크리스트"의 공정 이름에서 골랐다.
 */
export const EXTRA_COST_PRESETS: Record<ExtraCostCategory, string[]> = {
  interior: ["도배", "장판", "욕실", "주방", "샷시", "조명", "중문", "탄성코트"],
  appliance: ["에어컨", "냉장고", "김치냉장고", "세탁기", "건조기", "식기세척기", "TV"],
  furniture: ["소파", "침대", "식탁", "옷장", "책상", "커튼"],
  moving: ["포장이사", "입주청소", "사다리차"],
  other: ["법무사", "등기", "인터넷 설치"],
};

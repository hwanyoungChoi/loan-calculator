// 매물의 추가 비용(ADR-024). 공유 검증(server/)의 전이 의존이라 `@/` 별칭·DOM 타입을 쓰지 않는다.

/** 분류는 고정 5개다. 화면 순서는 `EXTRA_COST_CATEGORIES`가 정한다. */
export type ExtraCostCategory = "interior" | "appliance" | "furniture" | "moving" | "other";

/** 추가 비용 한 줄. 합계·총 필요 금액은 저장하지 않고 표시할 때 계산한다(ADR-007). */
export type ExtraCost = {
  category: ExtraCostCategory;
  /** 1~30자(코드포인트), 공백만은 안 된다. 클라이언트가 앞뒤 공백을 걷어 저장한다. */
  label: string;
  /** 만원 정수 1~MAX_AMOUNT(999,999,999) */
  amount: number;
};

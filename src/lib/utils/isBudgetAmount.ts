// 서버(worker tsc)와 클라이언트가 함께 쓴다. DOM 타입·`@/` 별칭 없이 상대 경로만 import한다.
import { MAX_AMOUNT } from "./amount";

/** 예산(만원) 값 검증: 1~최대 금액 정수. 기기 예산 파싱과 `/api/budget` 본문 검증의 단일 기준 */
export function isBudgetAmount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_AMOUNT;
}

/** 저장소에서 읽은 값이 정해진 문자열 값 중 하나인지 */
export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

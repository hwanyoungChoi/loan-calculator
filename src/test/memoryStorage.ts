/**
 * 테스트용 Storage. 같은 인스턴스로 스토어를 다시 만들면 "새로고침"이 된다.
 * 메서드가 객체의 일반 속성이라 `vi.spyOn(storage, "setItem")`으로 호출을 보거나 throw하게 만들 수 있다.
 */
export function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return items.size;
    },
    clear() {
      items.clear();
    },
    getItem(key: string) {
      return items.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(items.keys())[index] ?? null;
    },
    removeItem(key: string) {
      items.delete(key);
    },
    setItem(key: string, value: string) {
      items.set(key, String(value));
    },
  };
}

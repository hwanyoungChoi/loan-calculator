/** 저장 목록 가리기 모드(이 기기). 켜면 금액과 메모를 가린다. */
export type PrivacyModeStore = {
  getSnapshot: () => boolean;
  subscribe: (listener: () => void) => () => void;
  set: (isOn: boolean) => void;
};

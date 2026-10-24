/** 글자 크기 설정(이 기기). default는 원래 크기다. 값과 라벨은 `constants/textSize.ts` */
export type TextSize = "default" | "small" | "smaller";

export type TextSizeStore = {
  getSnapshot: () => TextSize;
  subscribe: (listener: () => void) => () => void;
  set: (size: TextSize) => void;
};

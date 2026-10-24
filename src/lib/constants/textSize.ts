import type { TextSize } from "@/lib/types/textSize";

/** 고르기 시트에 보이는 순서 */
export const TEXT_SIZES: TextSize[] = ["default", "small", "smaller"];

export const DEFAULT_TEXT_SIZE: TextSize = "default";

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  default: "기본",
  small: "작게",
  smaller: "더 작게",
};

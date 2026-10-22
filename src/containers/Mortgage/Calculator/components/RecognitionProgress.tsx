import styles from "./ScreenshotSheet.module.css";

import type { OcrProgress } from "@/lib/utils/ocrSession";

type RecognitionProgressProps = {
  progress: OcrProgress;
};

/** 화면 낭독이 1%마다 읽지 않게 문구는 10% 단위로 바꾼다. 막대는 그대로 움직인다. */
function toPercentStep(ratio: number): number {
  return Math.floor(ratio * 10) * 10;
}

/** 준비(엔진 내려받기·초기화)는 길이를 알 수 없어 움직이는 막대만, 글자 읽기는 진행률을 보인다. */
function RecognitionProgress({ progress }: RecognitionProgressProps) {
  const isPreparing = progress.phase === "preparing";
  return (
    <div className={styles.progress}>
      <p>
        {isPreparing
          ? "인식 준비 중…(처음 한 번 약 6MB 내려받음)"
          : `글자 읽는 중 ${toPercentStep(progress.ratio)}%`}
      </p>
      <progress
        className={styles.progressBar}
        aria-label="인식 진행률"
        value={isPreparing ? undefined : progress.ratio}
      />
    </div>
  );
}

export default RecognitionProgress;

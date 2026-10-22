import styles from "./EditingBanner.module.css";

import type { Ref } from "react";

type EditingBannerProps = {
  name: string;
  /** 입력이 유효하지 않으면 덮어쓸 값이 없어 비활성이다. 이유는 입력 칸 오류로 보인다 */
  isRenameDisabled: boolean;
  renameButtonRef: Ref<HTMLButtonElement>;
  onRename: () => void;
};

/**
 * 불러온 매물을 고치는 중이라는 표시와 "이름 바꾸기". 입력이 저장본과 같아 저장 버튼이 "저장됨"이어도
 * 이름만 바꿀 수 있게 저장 시트를 덮어쓰기로 연다(ADR-022 D7).
 */
function EditingBanner({ name, isRenameDisabled, renameButtonRef, onRename }: EditingBannerProps) {
  return (
    <div className={styles.banner}>
      <p className={styles.text}>{`'${name}' 수정 중`}</p>
      <button
        ref={renameButtonRef}
        type="button"
        className={styles.renameButton}
        disabled={isRenameDisabled}
        onClick={onRename}
      >
        이름 바꾸기
      </button>
    </div>
  );
}

export default EditingBanner;

import { formatRateBp } from "@/lib/utils/formatRateBp";

import styles from "./AreaOver85Switch.module.css";

type AreaOver85SwitchProps = {
  checked: boolean;
  /** 농어촌특별세 일반 세율(bp). 보조 문구에 쓴다 */
  ruralSpecialRateBp: number;
  onChange: (checked: boolean) => void;
};

const HINT_ID = "isAreaOver85-hint";

/** 전용 85㎡ 초과 스위치. 농어촌특별세는 이 경우에만 붙는다(ADR-022 D4). */
function AreaOver85Switch({ checked, ruralSpecialRateBp, onChange }: AreaOver85SwitchProps) {
  return (
    <div className={styles.field}>
      <label className={styles.switchRow}>
        <span>전용 85㎡ 초과</span>
        <input
          className={styles.switch}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-describedby={HINT_ID}
          onChange={(event) => onChange(event.target.checked)}
        />
      </label>
      <p id={HINT_ID} className={styles.hint}>
        농어촌특별세({formatRateBp(ruralSpecialRateBp)}) 계산에 씁니다
      </p>
    </div>
  );
}

export default AreaOver85Switch;

import { BORROWER_LABELS } from "@/lib/constants/loanConditions";
import { formatManwon } from "@/lib/utils/amount";

import styles from "./PreferredRequirements.module.css";

import type { PreferredBorrowerRequirements } from "@/lib/types/regulation";

type PreferredRequirementsProps = {
  requirements: PreferredBorrowerRequirements;
};

const FIRST_HOME_TIP = `생애최초에도 해당하면 '${BORROWER_LABELS.firstHome}'가 LTV가 더 높습니다`;

/** "무주택·서민실수요자"를 고르면 라디오 아래에 보이는 요건 안내. 수치는 규제 파일에서 만든다. */
function PreferredRequirements({ requirements }: PreferredRequirementsProps) {
  const lines = [
    `부부합산 연소득 ${formatManwon(requirements.maxCoupleIncome)} 이하`,
    `주택가격 ${formatManwon(requirements.maxHousePrice)} 이하`,
    requirements.householdRequirement,
  ];

  return (
    <div className={styles.box}>
      <p className={styles.title}>서민·실수요자 요건(모두 충족)</p>
      <ul className={styles.list}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className={styles.tip}>{FIRST_HOME_TIP}</p>
    </div>
  );
}

export default PreferredRequirements;

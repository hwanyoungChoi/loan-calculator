import { PATHS } from "@/lib/constants/paths";

import styles from "./KakaoLoginLink.module.css";

/**
 * 카카오 로그인 시작 링크. 페이지 전체가 Worker로 이동하고, 끝나면 `#/listings`로 돌아온다.
 * 색은 카카오 로그인 버튼 가이드의 컨테이너(#FEE500)·레이블(검정 85%)을 따른다.
 */
function KakaoLoginLink() {
  return (
    <a className={styles.link} href={PATHS.kakaoLogin}>
      카카오로 로그인
    </a>
  );
}

export default KakaoLoginLink;

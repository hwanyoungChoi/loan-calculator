# ADR-003 디렉토리 구조와 @/ alias

- 상태: 채택
- 맥락: CONVENTIONS의 containers/lib 구조를 이 프로젝트에 어떻게 맞출지(D3).
- 선택지: A containers/Mortgage/{Calculator,Listings} + lib/{constants,utils,types} + hooks/ + @/ alias / B 컨테이너 하나에 몰기
- 의견: planner(A) / client-dev(조건부 찬성, PATHS 상수·타입 위치·satisfies 사용 보완) / tester(규제 파일 경로가 고정돼 무결성 테스트 위치가 정해짐)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: A. 규제 값은 src/lib/constants/loanRegulations.ts 한 파일, 타입은 src/lib/types/, satisfies Regulations를 쓰고 as const는 쓰지 않는다. react-query·axios는 쓰지 않는다(HTTP 없음).
- 이유: CONVENTIONS를 그대로 따르고 CLAUDE.md의 규제 값 한 파일 제약을 만족한다.
- 뒤집을 조건: 없음(컨벤션 변경 시).

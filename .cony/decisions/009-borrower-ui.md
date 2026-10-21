# ADR-009 보유 상태는 4값 라디오 하나, 기본값은 규제지역·무주택

- 상태: 채택
- 맥락: 무주택/생애최초/1주택 처분조건부/1주택 미처분을 어떻게 고르게 할지, 초기 기본값(N2).
- 선택지: A borrower 4값과 1:1 라디오 / B 세그먼트 3개 + 조건부 생애최초 토글
- 의견: planner(A) / client-dev(A 제안, 토글 비활성 이유가 안 보임) / tester(UI-데이터 변환이 숨는 것을 지적)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: A. 초기값은 규제지역·무주택(일반). 결과 카드 상단에 조건 요약을 표시하고, 이후에는 draft가 마지막 선택을 기억한다.
- 이유: 변환 로직과 모순 상태가 사라진다. 기본값은 LTV가 낮은 쪽이라 과대 표시 위험이 작다.
- 뒤집을 조건: 조건이 늘어 라디오가 한 화면에 안 들어갈 때.

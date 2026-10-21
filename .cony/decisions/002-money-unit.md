# ADR-002 금액은 만원 정수, LTV는 정수 퍼센트

- 상태: 채택
- 맥락: 금액 입력 단위와 LTV 곱셈 방식(D2). client-dev가 Math.floor(90*0.7)=62 오류를 실측했다.
- 선택지: A 만원 정수 한 칸 + 한글 보조 표시 / B 억·만원 두 칸 / C 원 단위
- 의견: planner(A) / client-dev(찬성, 시세 표기 관례. 부동소수점 필수 수정) / tester(rate 단위 미정 지적, 정수 퍼센트 요구)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: A. 금액은 만원 정수(최대 9자리), rate는 0~100 정수, 한도는 Math.floor(base * rate / 100).
- 이유: 시세 표기 관례와 같고 정수 연산이라 테스트로 정확히 검증된다.
- 뒤집을 조건: 원 단위 정밀도가 필요한 계산(이자, 부대비용)이 들어올 때.

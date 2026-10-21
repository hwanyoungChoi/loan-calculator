# ADR-007 매물은 입력값만 저장하고 표시할 때 다시 계산한다

- 상태: 채택
- 맥락: 저장할 내용(D7).
- 선택지: A 입력만 저장 / B 결과까지 저장
- 의견: planner(A) / client-dev(찬성, 마이그레이션 불필요) / tester(찬성, 단 정렬·요약도 regulations를 인자로 받아야 함)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: A. 정렬과 카드 요약 함수는 regulations를 인자로 받는다.
- 이유: 비교가 항상 같은 규제 기준에서 이뤄지고 저장 모델이 단순하다. 목록 상단 기준일 표시로 규제 변경을 알린다.
- 뒤집을 조건: 저장 당시 결과를 보존해야 한다는 요구가 생길 때.

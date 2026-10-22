# ADR-013 LTV 옵션 계산 규칙: 서민·실수요자는 5번째 보유 상태, 요건 미충족은 ineligible, 사용자 지정도 한도 상한은 유지

- 상태: 채택
- 맥락: 우대 조건과 직접 지정을 함께 넣을 때의 계산 우선순위와 표시(D2, D4).
- 선택지: D2 A ineligible 상태로 계산하지 않고 이유 표시 / B 일반 무주택으로 자동 계산. D4 A 상한 유지 / B 상한 무시
- 의견: planner(D2 A, D4 A) / client-dev(D2·D4 찬성, 요약 바 표시·병기 규제값 정의·새 계산 시 사용자 지정 해제 요구) / tester(규칙 우선순위·경계 명시 요구)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: 보유 상태에 noHomePreferred(무주택·서민실수요자) 추가. 우선순위: ① 사용자 지정 LTV가 있으면 그 값(source custom) ② 서민·실수요자인데 판정 가격 max(매매가, KB시세)가 8억 초과면 ineligible ③ 셀이 null이면 unconfirmed ④ 규제 LTV. 한도 상한은 사용자 지정에도 적용(상한 없는 비수도권에서는 "상한 적용" 문구를 쓰지 않는다). 사용자 지정일 때 병기하는 규제 기준값은 같은 우선순위로 구한 값이고, ineligible·unconfirmed면 그 상태 문구를 병기한다. 요약 바에 "요건 미충족"·"사용자 지정 LTV n%" 표시. "새 계산"은 사용자 지정 LTV를 끈다. 소득·세대주는 앱이 확인하지 않는다는 문구를 결과 카드에 둔다.
- 이유: 1차 unconfirmed 패턴을 재사용하고, 과대 표시 방향의 실수를 기본값으로 막는다.
- 뒤집을 조건: 은행 실무가 사용자 지정 상황에서 상한을 다르게 적용한다는 확인이 있을 때.

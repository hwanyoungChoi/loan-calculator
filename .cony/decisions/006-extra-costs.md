# ADR-006 부대비용(취득세 등)은 이번에 넣지 않는다

- 상태: 채택
- 맥락: 필요한 자기자금에 부대비용을 포함할지(D6).
- 선택지: A 이번엔 제외하고 라벨에 표시 / B 취득세 자동 계산 / C 사용자 직접 입력
- 의견: planner(A, 다음 단계에서 C) / client-dev(찬성, 라벨 자체를 "필요한 자기자금(부대비용 제외)"로) / tester(테스트 영향 작음)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: A. 결과 라벨은 "필요한 자기자금(부대비용 제외)".
- 이유: 취득세율은 확인해야 할 규제 수치를 늘린다. 범위를 좁게 유지한다.
- 뒤집을 조건: 다음 단계에서 부대비용 직접 입력을 다룰 때.

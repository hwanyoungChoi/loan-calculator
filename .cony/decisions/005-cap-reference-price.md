# ADR-005 한도 상한 구간은 max(매매가, KB시세)로 판단한다 (검토 권장)

- 상태: 채택
- 맥락: 10·15 대책의 15억/25억 구간 "시가"가 KB시세인지 매매가인지 1차 출처에 정의가 없다(D5).
- 선택지: A KB시세 / B min(매매가, KB시세) / C max(매매가, KB시세) + 경계 매물 알림
- 의견: planner(C, 정의 없이 한도를 크게 보여주지 않기 위해) / client-dev(조건부 찬성, 구간 기준 가격을 화면에 표시하고 collateralBase·capReferencePrice 이름 분리) / tester(조건부 찬성, 가격 선택 함수 분리, isBoundaryCase는 구간 비교로 정의)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: C. 화면에 구간 판단에 쓴 가격을 표시하고, 두 가격이 다른 구간이면 경계 알림을 띄운다.
- 이유: CLAUDE.md의 "확인되지 않은 수치를 지어내지 않는다"에 따라 정의가 없는 쪽은 보수적으로 보여준다. 선택 함수 하나만 바꾸면 되돌릴 수 있다.
- 뒤집을 조건: 금융위·은행 안내에서 "시가"의 정의가 확인되면 그 정의를 따른다.

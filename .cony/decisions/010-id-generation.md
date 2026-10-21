# ADR-010 매물 id는 crypto.getRandomValues로 만들고 주입 가능하게 한다

- 상태: 채택
- 맥락: crypto.randomUUID는 secure context에서만 있어 휴대폰에서 http://192.168.x.x 개발 서버로 열면 저장이 실패한다(N3).
- 선택지: A crypto.randomUUID / B nanoid 추가 / C getRandomValues 16바이트 hex 함수
- 의견: planner(C) / tester(문제 제기, id·시각 주입 요구)
- 검토 원문: [client-dev](../reviews/spec-mortgage-calculator-client-dev.md) · [tester](../reviews/spec-mortgage-calculator-tester.md)
- 결정: C. 스토어 팩토리가 { storage, createId, now }를 받는다. id 검증은 비어 있지 않은 문자열까지만 한다.
- 이유: 한 경로만 쓰므로 폴백이 아니다. 몇 줄을 위해 의존성을 늘리지 않는다.
- 뒤집을 조건: id 형식 요구가 생길 때(예: 서버 동기화).

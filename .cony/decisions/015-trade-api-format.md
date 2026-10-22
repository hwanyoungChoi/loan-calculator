# ADR-015 실거래가는 상세 자료 API, 응답은 JSON이 되면 JSON 아니면 fast-xml-parser

- 상태: 채택
- 맥락: 기본·상세 API 중 무엇을 쓰고, Workers에 DOMParser가 없는 상황에서 XML을 어떻게 읽을지(D6).
- 선택지: A 상세 자료 + JSON 우선, 안 되면 fast-xml-parser / B 기본 자료 / C 정규식 직접 파싱
- 의견: planner(A) / backend-dev(조건부 찬성, 무료 플랜 CPU 한도 때문에 JSON 우선, 정규식 전체 파싱 반대) / tester(조건부 찬성, 형식 중립 파서 이름, 0·1건·공백·엔티티 fixture 필수, 2-3 앞당김)
- 검토 원문: [backend-dev](../reviews/spec-ltv-options-and-import-backend-dev.md) · [client-dev](../reviews/spec-ltv-options-and-import-client-dev.md) · [tester](../reviews/spec-ltv-options-and-import-tester.md)
- 결정: A. 파서 이름은 parseTradesResponse(text). fixture는 **fixtures** 원문 파일로 두고 assumed/real을 구분하며, real fixture 통과를 AC-4 종결 조건으로 한다. 사용자 키가 오면 실제 응답 확인(2-3)을 서버 골격 직후로 당긴다. fast-xml-parser를 쓰면 parseTagValue false, item은 항상 배열, trim.
- 이유: 해제 거래 제외 필드가 필요하고, 정규식 전체 파싱은 테스트로 지켜야 할 경우가 너무 많다.
- 뒤집을 조건: 실제 응답에서 상세 자료에 해제 필드가 없거나 CPU 한도를 넘을 때.

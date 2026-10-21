import reactConfig from "@conychoi/eslint-config/react";

export default [
  ...reactConfig,
  { ignores: ["dist/**"] },
  // 공용 config 는 프로젝트마다 다른 경로 alias 를 알지 못한다.
  // 알려주지 않으면 @/ 가 외부 패키지로 분류되어 import 순서가 컨벤션과 어긋난다.
  { settings: { "import/internal-regex": "^@/" } },
];

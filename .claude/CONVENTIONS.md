# Dev 공통 규칙

React/Next.js 기반 프로젝트에서 공통으로 적용되는 디렉토리 구조 · API 호출 · 표기법 규칙.
프로젝트별 특화 사항(인증, 환경 변수, 개인, 사내 패키지 등)은 각 프로젝트 루트의 `AGENTS.md` 또는 `CLAUDE.md`에서 정의한다.

## 디렉토리 구조 규칙

```
project-root/
├── pages/ 또는 app/    # 라우팅 진입점 (얇게 유지)
│   └── notice/
│       ├── index.tsx           # → containers/Notice/List 노출
│       └── [id].tsx            # → containers/Notice/Item 노출
│
├── containers/         # 실제 페이지 구현 (= features)
│   └── Notice/
│       ├── List/
│       │   ├── NoticeList.tsx
│       │   ├── components/     # 이 View 전용 컴포넌트
│       │   └── hooks/          # 이 View 전용 훅 (API 훅 포함)
│       └── Item/
│           ├── NoticeItem.tsx
│           ├── components/
│           └── hooks/
│
├── components/         # 전역 공통 컴포넌트 (2개 이상 container에서 재사용 시에만)
├── hooks/              # 전역 공통 훅 (도메인 무관: useDebounce, useMediaQuery 등)
├── lib/                # 비-React 코드
│   ├── api/
│   │   ├── queryClient.ts   # react-query 인스턴스
│   │   └── client.ts        # axios 인스턴스
│   ├── constants/
│   ├── utils/
│   └── types/
├── styles/
└── public/
```

### 핵심 원칙

1. **지역성 우선** — 한 곳에서만 쓰는 코드는 그 옆에 둔다. `components/`, `hooks/`에 미리 만들지 않는다.
2. **승격은 사후에** — 재사용이 실제로 발생할 때 전역으로 옮긴다.
3. **단방향 의존성** — `pages/app → containers → components/lib` 순서로만 import.
4. **얇은 진입점** — 비즈니스 로직은 `containers`에. 라우팅 파일은 컴포넌트 import + 노출만.

### 새 코드 추가 시 판단 기준

```
React 컴포넌트/훅인가?
├── No → lib/ (api, utils, constants, types 중 하나)
└── Yes →
    한 container에서만 쓰는가?
    ├── Yes → containers/{Name}/components 또는 hooks
    └── No → components/ 또는 hooks/
```

## API 호출 규칙 (react-query 기반)

### 핵심 원칙

- **모든 API 요청은 react-query 커스텀 훅으로 감싼다.** 컴포넌트는 `axios`/`fetch`를 직접 호출하지 않는다.
- **한 파일에 한 API + 한 훅** — `fetchXxx`(비공개), `xxxQueryKey`(export), `useXxx`(export)을 같은 파일에 둔다.
- **queryKey는 함수로 export** — `invalidateQueries`에서 일관되게 재사용한다.
- 조회는 `useQuery`, 변경은 `useMutation`.

### 파일 위치

- API 훅은 사용 container 옆에: `containers/{Domain}/{List|Item}/hooks/useXxx.ts`
- HTTP 클라이언트(axios 인스턴스 등)만 `lib/api/client.ts`에 둔다.

### 예시

```ts
// containers/Notice/List/hooks/useNoticeList.ts
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

interface NoticeListParams {
  /* ... */
}
interface NoticeListResponse {
  /* ... */
}

export const noticeListQueryKey = (params?: NoticeListParams) =>
  params ? (["notice", "list", params] as const) : (["notice", "list"] as const);

const fetchNoticeList = (params: NoticeListParams) =>
  apiClient.get<NoticeListResponse>("/notice", { params });

export function useNoticeList(params: NoticeListParams) {
  return useQuery({
    queryKey: noticeListQueryKey(params),
    queryFn: () => fetchNoticeList(params),
  });
}
```

```ts
// containers/Notice/List/hooks/useDeleteNotice.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { noticeListQueryKey } from "./useNoticeList";

const deleteNotice = (id: number) => apiClient.delete(`/notice/${id}`);

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeListQueryKey() });
    },
  });
}
```

## 표기법 (Naming Conventions)

### queryKey

- 형태: `["{domain}", "list" | "item", ...args]` — 배열 + 도메인 prefix
- 이름: 단건은 `{domain}QueryKey`, 목록은 `{domain}ListQueryKey`
- 함수형 export — 인자 없이 호출하면 prefix만 반환 (전체 무효화용), 인자 있으면 특정 캐시만 매칭
- ❌ 문자열 형태(`"notice-list"`) 금지

### 파일 · 디렉토리

- React 컴포넌트 파일: `PascalCase.tsx` (예: `NoticeList.tsx`)
- 훅 파일: `useCamelCase.ts` (예: `useNoticeList.ts`)
- 비-React 모듈: `camelCase.ts` (예: `formatDate.ts`)
- container 디렉토리: `PascalCase/` (예: `Notice/List/`)
- 그 외 디렉토리: `kebab-case` 또는 `camelCase` 일관 유지

### 식별자

- 변수 · 함수: `camelCase`
- 컴포넌트 · 타입 · 인터페이스: `PascalCase`
- 상수: `SCREAMING_SNAKE_CASE`
- boolean: `is/has/should/can` 접두사 (`isLoading`, `hasError`)
- 이벤트 핸들러: `handle{Event}` (선언) / `on{Event}` (prop)

### import 순서

ESLint `import/order` 규칙 기본값을 따르며, 그룹 사이는 빈 줄로 구분:

1. Node.js 빌트인
2. 외부 패키지 (`react`, `next`, ...)
3. 내부 alias (`@/lib`, `@/components`, ...)
4. 상대 경로 (`./`, `../`)
5. 스타일 (`*.css`, `*.scss`)

## Lint / Format 세팅

새 프로젝트는 **ESLint + Prettier**를 반드시 설치하고, 커밋 전에 동작하도록 맞춘다.
개인 공용 config(`@conychoi/eslint-config`, `@conychoi/prettier-config` 등)가 있으면 그것을 우선 사용하고, 없을 때만 아래 기본 세팅을 따른다.

### ESLint (v9 flat config)

```bash
npm i -D eslint@^9 @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-import eslint-plugin-react eslint-plugin-react-hooks \
  eslint-config-prettier
```

```js
// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin, react, "react-hooks": reactHooks },
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  prettier, // 항상 마지막 — Prettier와 충돌하는 룰 비활성화
];
```

⚠️ ESLint v10은 일부 플러그인(`eslint-plugin-react`) 미지원이므로 **v9 사용**.
Next.js 프로젝트면 `eslint-config-next`를 추가로 spread.

### Prettier

```bash
npm i -D prettier
```

```js
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 100,
  arrowParens: "always",
  endOfLine: "lf",
};
```

### package.json scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 에디터 연동

- VS Code: `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode` 설치 후 저장 시 자동 포맷 활성화
- `.vscode/settings.json`에 `"editor.formatOnSave": true`, `"editor.defaultFormatter": "esbenp.prettier-vscode"` 권장

## 안티 패턴 (절대 금지)

- ❌ 컴포넌트에서 `axios`/`fetch` 직접 호출
- ❌ API 함수를 객체로 묶어 export (`noticeApi.getList(...)` 식)
- ❌ `queryKey`를 사용처마다 직접 작성 (배열 리터럴 복붙)
- ❌ `queryKey`를 문자열로 작성 (`"notice-list"`)
- ❌ 라우팅 진입점(`pages/`, `app/`)에 비즈니스 로직 작성
- ❌ "언젠가 쓸 것 같아서" 미리 `components/`, `hooks/`에 빼두기
- ❌ container 간 직접 import (서로 독립이어야 함 — 공유가 필요하면 전역으로 승격)

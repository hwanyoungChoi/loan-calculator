import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

import { createQueryClient } from "@/lib/api/queryClient";

import type { ReactElement } from "react";

/** 앱과 같은 기본값의 QueryClient를 테스트마다 새로 만들어 캐시가 테스트 사이에 남지 않게 한다. */
export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

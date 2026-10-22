import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/api/queryClient";

import AppRoutes from "./AppRoutes";

/** Provider와 Layout이 들어올 자리 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}

export default App;

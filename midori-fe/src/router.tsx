import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Singleton QueryClient for React Query.
 * Created once at module load time to ensure consistent cache across route navigations.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu được coi là mới trong 5 phút, không re-fetch nhảm
      refetchOnWindowFocus: false, // Tắt tự động fetch khi bấm ra vào tab
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

/**
 * Export the singleton QueryClient for direct access if needed.
 */
export { queryClient };

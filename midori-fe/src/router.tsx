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
      /**
       * Disable caching in development for instant HMR updates.
       * Set to a higher value (e.g., 5 * 60 * 1000) for production to reduce API calls.
       */
      staleTime: import.meta.env.PROD 
        ? 5 * 60 * 1000  // 5 minutes in production
        : 0,              // Instant refresh in development
      gcTime: import.meta.env.PROD 
        ? 10 * 60 * 1000  // 10 minutes garbage collection in production
        : 2 * 60 * 1000, // 2 minutes in development
      refetchOnWindowFocus: import.meta.env.PROD,
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

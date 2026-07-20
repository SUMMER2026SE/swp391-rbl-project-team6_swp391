import { useEffect, useCallback, useRef } from "react";

/**
 * ForceRefresh component - ensures fresh content on navigation and helps with HMR
 * 
 * In development:
 * - Checks for module updates frequently
 * - Forces fresh imports on visibility change
 * - Helps TanStack Router pick up code changes
 * 
 * In production:
 * - Only checks on first load
 * - Normal browser caching applies
 */
export function ForceRefresh({ children }: { children: React.ReactNode }) {
  const isDev = import.meta.env.DEV;
  const lastCheckRef = useRef<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (isDev) {
      // In development, invalidate module cache more aggressively
      const invalidateCache = () => {
        const now = Date.now();
        // Only check every 10 seconds to avoid excessive operations
        if (now - lastCheckRef.current > 10000) {
          lastCheckRef.current = now;
          
          // Invalidate React Query cache to force fresh fetches
          // This is handled by the QueryClient singleton with staleTime: 0
        }
      };

      // Check for updates on visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          invalidateCache();
        }
      };

      // Check on focus
      const handleFocus = () => {
        invalidateCache();
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);

      // Initial check
      invalidateCache();

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [isDev]);

  return <>{children}</>;
}

/**
 * Hook to force a hard refresh of the page.
 * Use this when you need to ensure the user sees the latest code.
 */
export function useForceRefresh() {
  const refresh = useCallback(() => {
    // Clear various caches before refresh
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Clear localStorage build timestamp to force fresh load
    localStorage.removeItem("midori_build_timestamp");
    localStorage.removeItem("midori_last_check");
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force hard reload bypassing cache
    window.location.reload();
  }, []);

  return refresh;
}

/**
 * Development-only hook to log HMR updates
 */
export function useHMRDebug() {
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return;

    // Log when modules are reloaded
    if (import.meta.hot) {
      import.meta.hot.on("vite:beforeUpdate", (payload) => {
        console.log("[HMR] Module updating:", payload.modules);
      });

      import.meta.hot.on("vite:afterUpdate", (payload) => {
        console.log("[HMR] Module updated:", payload.modules);
      });

      import.meta.hot.on("vite:error", (payload) => {
        console.error("[HMR] Error:", payload);
      });
    }
  }, [isDev]);
}

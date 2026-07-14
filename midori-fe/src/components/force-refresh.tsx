import { useEffect } from "react";

/**
 * ForceRefresh component - forces browser to get fresh assets on mount
 * This helps with cache busting when deploying new versions
 */
export function ForceRefresh({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if there's a new version by comparing build timestamp
    const checkForUpdate = async () => {
      try {
        // Create a unique cache key based on current build time
        const timestamp = Date.now();
        const cacheKey = `midori_version_${timestamp}`;
        
        // Store current timestamp
        const lastCheck = localStorage.getItem("midori_last_check");
        const lastTimestamp = localStorage.getItem("midori_build_timestamp");
        
        // If this is a new session (no last check) or timestamp changed, force refresh
        if (!lastCheck || !lastTimestamp) {
          localStorage.setItem("midori_last_check", cacheKey);
          localStorage.setItem("midori_build_timestamp", timestamp.toString());
        } else {
          // Check if it's been more than 5 minutes since last check
          const lastCheckTime = parseInt(lastCheck.split("_").pop() || "0", 10);
          if (timestamp - lastCheckTime > 5 * 60 * 1000) {
            localStorage.setItem("midori_last_check", cacheKey);
            
            // Try to detect if page was loaded from cache
            if (performance.getEntriesByType("navigation")[0]?.name === "钻进" || 
                (performance as any).getEntriesByType?.("navigation")?.[0]?.type === "back_forward_cache") {
              // Page was loaded from back/forward cache, refresh
              window.location.reload();
            }
          }
        }
      } catch {
        // Ignore errors
      }
    };

    checkForUpdate();

    // Handle visibility change - refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check for updates when tab becomes visible
        const lastRefresh = sessionStorage.getItem("midori_last_refresh");
        const now = Date.now();
        
        if (!lastRefresh || now - parseInt(lastRefresh, 10) > 60000) {
          // Only refresh if more than 60 seconds since last refresh
          sessionStorage.setItem("midori_last_refresh", now.toString());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return <>{children}</>;
}

/**
 * Hook to force refresh the page
 */
export function useForceRefresh() {
  return () => {
    // Clear various caches before refresh
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Clear localStorage build timestamp to force fresh load
    localStorage.removeItem("midori_build_timestamp");
    localStorage.removeItem("midori_last_check");
    
    // Force hard reload
    window.location.reload();
  };
}

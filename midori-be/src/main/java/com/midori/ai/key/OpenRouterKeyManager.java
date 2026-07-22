package com.midori.ai.key;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe key manager for OpenRouter with round-robin rotation.
 *
 * <p>On a temporary failure (429, timeout, network), the manager immediately
 * rotates to the next key so the caller can retry without re-building the
 * request body.
 *
 * <p>On a permanent failure (API_KEY_INVALID / auth error) the key is
 * permanently excluded from the active set for the lifetime of this object.
 *
 * <p>All state is kept in memory; there is no persistence across restarts.
 */
@Slf4j
public class OpenRouterKeyManager {

    private final String[] allKeys;
    private final AtomicInteger currentIndex = new AtomicInteger(0);
    private volatile int remaining;

    public OpenRouterKeyManager(String[] keys) {
        if (keys == null || keys.length == 0) {
            this.allKeys = new String[0];
            this.remaining = 0;
        } else {
            this.allKeys = keys.clone();
            this.remaining = allKeys.length;
        }
    }

    /**
     * Returns the next available key, skipping any permanently failed ones.
     * Returns null when all keys have been permanently excluded.
     */
    public String getCurrentKey() {
        if (remaining == 0) return null;
        int idx = currentIndex.get();
        return allKeys[idx];
    }

    /**
     * Returns the 1-based index (for logging) of the key currently pointed to.
     */
    public int getCurrentKeyIndex() {
        return currentIndex.get();
    }

    /**
     * Total number of configured keys.
     */
    public int getTotalKeyCount() {
        return allKeys.length;
    }

    /**
     * Number of keys still available (not permanently excluded).
     */
    public int getRemainingKeyCount() {
        return remaining;
    }

    /**
     * Rotate to the next key after a temporary failure (429, timeout, network).
     * Skips permanently excluded keys.
     */
    public String getNextKey() {
        if (remaining == 0) return null;
        if (allKeys.length <= 1) return allKeys.length == 1 ? allKeys[0] : null;

        int next = (currentIndex.incrementAndGet()) % allKeys.length;
        // Spin until we land on a key that is still active
        int scanned = 0;
        while (scanned < allKeys.length) {
            if (allKeys[next] != null) {
                currentIndex.set(next);
                return allKeys[next];
            }
            next = (next + 1) % allKeys.length;
            scanned++;
        }
        return null;
    }

    /**
     * Permanently exclude the given key from future use (e.g. API_KEY_INVALID).
     * The remaining count is decremented atomically.
     */
    public void excludeKey(String key) {
        if (key == null) return;
        for (int i = 0; i < allKeys.length; i++) {
            if (key.equals(allKeys[i])) {
                String masked = mask(key);
                allKeys[i] = null;
                remaining--;
                log.warn("[OpenRouterKeyManager] Excluded key (index={}/{}): {} — permanently invalid",
                        i + 1, allKeys.length, masked);
                // Rotate current pointer if we just excluded the active key
                if (i == currentIndex.get() && remaining > 0) {
                    getNextKey();
                }
                return;
            }
        }
    }

    /**
     * Mask a key for safe logging: first 4 chars + "..." + last 4 chars.
     */
    public static String mask(String key) {
        if (key == null || key.length() <= 8) return "***";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }
}

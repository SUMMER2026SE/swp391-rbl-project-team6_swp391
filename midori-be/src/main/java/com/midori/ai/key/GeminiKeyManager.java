package com.midori.ai.key;

import lombok.extern.slf4j.Slf4j;

/**
 * Manages multiple API keys for providers with automatic fallback support.
 *
 * Features:
 * - Store multiple keys per provider
 * - Automatic fallback when a key fails (rate limit, quota, etc.)
 * - Round-robin key selection for load distribution (future)
 * - Thread-safe key rotation with cooldowns
 */
@Slf4j
public class GeminiKeyManager {

    private final String[] keys;
    private final long[] cooldownUntil;
    private final boolean[] excluded;
    private final Object lock = new Object();
    private volatile int currentIndex = 0;

    // Cooldown duration: 15 seconds (per-key backoff on 429)
    private static final long COOLDOWN_DURATION_MS = 15000;

    public GeminiKeyManager(String keysConfig) {
        if (keysConfig == null || keysConfig.isBlank()) {
            this.keys = new String[0];
            this.cooldownUntil = new long[0];
            this.excluded = new boolean[0];
            return;
        }

        this.keys = keysConfig.split(",");
        this.cooldownUntil = new long[this.keys.length];
        this.excluded = new boolean[this.keys.length];
        for (int i = 0; i < this.keys.length; i++) {
            this.keys[i] = this.keys[i].trim();
            this.cooldownUntil[i] = 0;
            this.excluded[i] = false;
        }
    }

    public String getCurrentKey() {
        return getCurrentKey(false);
    }

    /**
     * Get the current API key (no rotation).
     * If the current key is in cooldown or excluded, searches for the next available key.
     * If all active keys are in cooldown, sleeps (if allowSleep is true) or throws RateLimitedException.
     */
    public String getCurrentKey(boolean allowSleep) {
        if (keys.length == 0) {
            return null;
        }

        long waitTime = 0;
        int bestIndex = 0;

        synchronized (lock) {
            long now = System.currentTimeMillis();

            // 1. Try to find a key that is not in cooldown and not excluded
            for (int i = 0; i < keys.length; i++) {
                int index = (currentIndex + i) % keys.length;
                if (!excluded[index] && now >= cooldownUntil[index] && !com.midori.ai.core.AiProviderStateManager.isKeyInCooldown("GEMINI", mask(keys[index]))) {
                    currentIndex = index;
                    return keys[currentIndex];
                }
            }

            // 2. If all keys are in cooldown or excluded, find the active key with the minimum cooldown
            bestIndex = -1;
            long minCooldownTime = Long.MAX_VALUE;
            for (int i = 0; i < keys.length; i++) {
                int index = (currentIndex + i) % keys.length;
                if (!excluded[index]) {
                    if (cooldownUntil[index] < minCooldownTime) {
                        minCooldownTime = cooldownUntil[index];
                        bestIndex = index;
                    }
                }
            }

            if (bestIndex == -1) {
                return null;
            }

            waitTime = minCooldownTime - now;
            currentIndex = bestIndex;
        }

        if (waitTime > 0) {
            if (!allowSleep) {
                throw new com.midori.exception.AiException.RateLimitedException(
                        "All Gemini keys are in cooldown. Rate limit exceeded.");
            }
            String maskedKey = mask(keys[bestIndex]);
            log.warn("[GeminiKeyManager] All keys in cooldown. Waiting for {}ms on key index {} (key: {})...",
                    waitTime, bestIndex, maskedKey);
            try {
                Thread.sleep(waitTime);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("[GeminiKeyManager] Thread interrupted while waiting for key cooldown", e);
            }
        }

        return keys[currentIndex];
    }

    /**
     * Get the next API key with automatic fallback.
     * If the current key fails, call this method to get the next available key.
     *
     * @return the next available key, or null if no keys are available
     */
    public String getNextKey() {
        if (keys.length <= 1) {
            if (keys.length == 1 && !excluded[0] && System.currentTimeMillis() >= cooldownUntil[0] && !com.midori.ai.core.AiProviderStateManager.isKeyInCooldown("GEMINI", mask(keys[0]))) {
                return keys[0];
            }
            return null;
        }

        synchronized (lock) {
            currentIndex = (currentIndex + 1) % keys.length;
            return getCurrentKey();
        }
    }

    /**
     * Mark the current key as failed and rotate to the next key.
     *
     * @return the next available key after rotation
     */
    public String markKeyFailedAndGetNext() {
        synchronized (lock) {
            if (keys.length > 0) {
                long now = System.currentTimeMillis();
                cooldownUntil[currentIndex] = now + COOLDOWN_DURATION_MS;
                String maskedKey = mask(keys[currentIndex]);
                log.warn("[GeminiKeyManager] Key index {} ({}) put on cooldown for {}ms", currentIndex, maskedKey, COOLDOWN_DURATION_MS);

                currentIndex = (currentIndex + 1) % keys.length;
            }
            return getCurrentKey();
        }
    }

    /**
     * Permanently exclude the given key from future use (due to API_KEY_INVALID).
     */
    public void excludeKey(String key) {
        if (key == null) return;
        synchronized (lock) {
            for (int i = 0; i < keys.length; i++) {
                if (key.equals(keys[i])) {
                    if (!excluded[i]) {
                        excluded[i] = true;
                        String masked = mask(key);
                        log.warn("[GeminiKeyManager] Permanently excluded key index {}/{} (key: {}) due to invalid auth", i, keys.length, masked);
                    }
                    if (i == currentIndex && getRemainingKeyCount() > 0) {
                        getNextKey();
                    }
                    return;
                }
            }
        }
    }

    public int getRemainingKeyCount() {
        int count = 0;
        for (boolean b : excluded) {
            if (!b) count++;
        }
        return count;
    }

    public int getKeyIndex(String key) {
        if (key == null) return -1;
        for (int i = 0; i < keys.length; i++) {
            if (key.equals(keys[i])) {
                return i;
            }
        }
        return -1;
    }

    public static String mask(String key) {
        if (key == null || key.length() <= 8) return "***";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }

    /**
     * Get all configured keys (for admin purposes only, never log them).
     *
     * @return number of configured keys
     */
    public int getKeyCount() {
        return keys.length;
    }

    /**
     * Check if any key is configured.
     */
    public boolean hasKeys() {
        return keys.length > 0;
    }

    /**
     * Check if the given key index is the current one.
     */
    public boolean isCurrentKey(int index) {
        return currentIndex == index;
    }

    /**
     * Reset to first key (for recovery purposes).
     */
    public void resetToFirst() {
        synchronized (lock) {
            currentIndex = 0;
            for (int i = 0; i < cooldownUntil.length; i++) {
                cooldownUntil[i] = 0;
                excluded[i] = false;
            }
        }
    }

    /**
     * Get key availability info for monitoring.
     */
    public String getStatus() {
        if (keys.length == 0) {
            return "NO_KEYS_CONFIGURED";
        }
        if (keys.length == 1) {
            return "SINGLE_KEY";
        }
        return "MULTI_KEYS(" + keys.length + ") current=" + currentIndex;
    }
}

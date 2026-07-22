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
    private final Object lock = new Object();
    private volatile int currentIndex = 0;

    // Cooldown duration: 15 seconds (per-key backoff on 429)
    private static final long COOLDOWN_DURATION_MS = 15000;

    public GeminiKeyManager(String keysConfig) {
        if (keysConfig == null || keysConfig.isBlank()) {
            this.keys = new String[0];
            this.cooldownUntil = new long[0];
            return;
        }
        
        this.keys = keysConfig.split(",");
        this.cooldownUntil = new long[this.keys.length];
        for (int i = 0; i < this.keys.length; i++) {
            this.keys[i] = this.keys[i].trim();
            this.cooldownUntil[i] = 0;
        }
    }

    /**
     * Get the current API key (no rotation).
     * If the current key is in cooldown, searches for the next available key that is not in cooldown.
     * If all keys are in cooldown, sleeps until the one with the shortest remaining cooldown is ready.
     */
    public String getCurrentKey() {
        if (keys.length == 0) {
            return null;
        }
        
        synchronized (lock) {
            long now = System.currentTimeMillis();
            
            // 1. Try to find a key that is not in cooldown
            for (int i = 0; i < keys.length; i++) {
                int index = (currentIndex + i) % keys.length;
                if (now >= cooldownUntil[index]) {
                    currentIndex = index;
                    return keys[currentIndex];
                }
            }
            
            // 2. If all keys are in cooldown, find the one with the minimum cooldown
            int bestIndex = currentIndex;
            long minCooldownTime = cooldownUntil[currentIndex];
            for (int i = 0; i < keys.length; i++) {
                if (cooldownUntil[i] < minCooldownTime) {
                    minCooldownTime = cooldownUntil[i];
                    bestIndex = i;
                }
            }
            
            long waitTime = minCooldownTime - now;
            if (waitTime > 0) {
                String maskedKey = keys[bestIndex].substring(0, Math.min(4, keys[bestIndex].length())) + "...";
                log.warn("[GeminiKeyManager] All keys in cooldown. Waiting for {}ms on key index {} (key: {})...", 
                        waitTime, bestIndex, maskedKey);
                try {
                    Thread.sleep(waitTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("[GeminiKeyManager] Thread interrupted while waiting for key cooldown", e);
                }
            }
            
            currentIndex = bestIndex;
            return keys[currentIndex];
        }
    }

    /**
     * Get the next API key with automatic fallback.
     * If the current key fails, call this method to get the next available key.
     * 
     * @return the next available key, or null if no keys are available
     */
    public String getNextKey() {
        if (keys.length <= 1) {
            return keys.length == 1 ? keys[0] : null;
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
                String maskedKey = keys[currentIndex].substring(0, Math.min(4, keys[currentIndex].length())) + "...";
                log.warn("[GeminiKeyManager] Key {} put on cooldown for {}ms", maskedKey, COOLDOWN_DURATION_MS);
                
                currentIndex = (currentIndex + 1) % keys.length;
            }
            return getCurrentKey();
        }
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

package com.midori.ai.core;

import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Centralized, thread-safe, in-memory state manager for AI provider routes.
 * Handles key cooldowns, model-wide cooldowns, and last-known-good routing per AI task type.
 */
@Slf4j
public final class AiProviderStateManager {

    public static final long COOLDOWN_5_MINUTES_MS = 300_000L;
    public static final long COOLDOWN_2_MINUTES_MS = 120_000L;

    private static final Map<String, Long> keyCooldowns = new ConcurrentHashMap<>();
    private static final Map<String, Long> modelCooldowns = new ConcurrentHashMap<>();
    private static final Map<AiTaskType, RouteInfo> lastKnownGoodRoutes = new ConcurrentHashMap<>();

    private AiProviderStateManager() {}

    public record RouteInfo(
        AiProviderType providerType,
        String model,
        int keyIndex,
        String safeKeyId
    ) {}

    /**
     * Clear all in-memory cooldowns and routing state. Used during testing and reset.
     */
    public static void reset() {
        keyCooldowns.clear();
        modelCooldowns.clear();
        lastKnownGoodRoutes.clear();
        log.debug("[AiProviderStateManager] Reset all in-memory cooldown and routing state.");
    }

    // ============================================================
    // Cooldown Recording & Verification
    // ============================================================

    /**
     * Record a temporary cooldown for a specific provider key index/ID (e.g. due to HTTP 429).
     */
    public static void recordKeyCooldown(String provider, String model, int keyIndex, String keyId, long durationMs, String reason) {
        if (keyId == null) return;
        long expiry = System.currentTimeMillis() + durationMs;
        keyCooldowns.put(provider + ":" + keyId, expiry);
        log.warn("[AiProviderStateManager] Cooldown applied — Resource: KEY, Provider: {}, Model: {}, KeyIndex: {}, Reason: {}, Expiry: {}ms from now",
                provider, model != null ? model : "N/A", keyIndex, reason, durationMs);
    }

    /**
     * Record a temporary cooldown for a model route (e.g. upstream shared-pool limit, absolute timeout, or excessive latency >60s).
     */
    public static void recordModelCooldown(String provider, String model, long durationMs, String reason) {
        if (provider == null || model == null) return;
        long expiry = System.currentTimeMillis() + durationMs;
        modelCooldowns.put(provider + ":" + model, expiry);
        log.warn("[AiProviderStateManager] Cooldown applied — Resource: MODEL, Provider: {}, Model: {}, KeyIndex: N/A, Reason: {}, Expiry: {}ms from now",
                provider, model, reason, durationMs);
    }

    /**
     * Check if a specific API key is currently cooling down. Expired entries become available automatically.
     */
    public static boolean isKeyInCooldown(String provider, String keyId) {
        if (keyId == null) return false;
        String key = provider + ":" + keyId;
        Long expiry = keyCooldowns.get(key);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() >= expiry) {
            keyCooldowns.remove(key);
            return false;
        }
        return true;
    }

    /**
     * Check if a specific provider model is currently cooling down. Expired entries become available automatically.
     */
    public static boolean isModelInCooldown(String provider, String model) {
        if (provider == null || model == null) return false;
        String key = provider + ":" + model;
        Long expiry = modelCooldowns.get(key);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() >= expiry) {
            modelCooldowns.remove(key);
            return false;
        }
        return true;
    }

    // ============================================================
    // Last-Known-Good Routing
    // ============================================================

    /**
     * Record a successful provider route for a specific task type.
     * Success is recorded only after HTTP 200, valid JSON parsing, and at least one accepted generated question.
     */
    public static void recordSuccess(AiTaskType taskType, AiProviderType providerType, String model, int keyIndex, String safeKeyId, boolean isValidJson, int acceptedQuestions) {
        if (taskType == null || providerType == null || model == null) {
            return;
        }
        // Strict guard: do not record success for malformed JSON or zero accepted questions
        if (!isValidJson || acceptedQuestions <= 0) {
            log.debug("[AiProviderStateManager] Not recording last-known-good for task={}: validJson={}, accepted={}", taskType, isValidJson, acceptedQuestions);
            return;
        }
        RouteInfo route = new RouteInfo(providerType, model, keyIndex, safeKeyId != null ? safeKeyId : "N/A");
        lastKnownGoodRoutes.put(taskType, route);
        modelCooldowns.remove(providerType.name() + ":" + model);
        if (safeKeyId != null && !"N/A".equals(safeKeyId)) {
            keyCooldowns.remove(providerType.name() + ":" + safeKeyId);
        }
        log.info("[AiProviderStateManager] Updated last-known-good route for task={} -> Provider: {}, Model: {}, KeyIndex: {}",
                taskType, providerType, model, keyIndex);
    }

    /**
     * Get the last-known-good route for a task type if available and not currently cooling down.
     */
    public static RouteInfo getPreferredRoute(AiTaskType taskType) {
        if (taskType == null) return null;
        RouteInfo info = lastKnownGoodRoutes.get(taskType);
        if (info == null) return null;

        // Check if the route is cooling down
        if (isModelInCooldown(info.providerType.name(), info.model)) {
            log.debug("[AiProviderStateManager] Skipping last-known-good route for task={} because model {} is in cooldown.", taskType, info.model);
            return null;
        }
        if (info.safeKeyId != null && !"N/A".equals(info.safeKeyId) && isKeyInCooldown(info.providerType.name(), info.safeKeyId)) {
            log.debug("[AiProviderStateManager] Skipping last-known-good route for task={} because key {} is in cooldown.", taskType, info.safeKeyId);
            return null;
        }
        return info;
    }

    public static java.util.List<AiProviderType> reorderProviders(java.util.List<AiProviderType> defaultOrder, AiTaskType taskType) {
        java.util.List<AiProviderType> order = new java.util.ArrayList<>(defaultOrder);
        RouteInfo preferred = getPreferredRoute(taskType);
        if (preferred != null && order.contains(preferred.providerType())) {
            AiProviderType primary = defaultOrder.get(0);
            if (primary != preferred.providerType()) {
                boolean primaryHasCooldown = false;
                String primaryPrefix = primary.name() + ":";
                long now = System.currentTimeMillis();
                for (Map.Entry<String, Long> entry : keyCooldowns.entrySet()) {
                    if (entry.getKey().startsWith(primaryPrefix) && now < entry.getValue()) {
                        primaryHasCooldown = true;
                        break;
                    }
                }
                if (!primaryHasCooldown) {
                    for (Map.Entry<String, Long> entry : modelCooldowns.entrySet()) {
                        if (entry.getKey().startsWith(primaryPrefix) && now < entry.getValue()) {
                            primaryHasCooldown = true;
                            break;
                        }
                    }
                }
                if (primaryHasCooldown) {
                    order.remove(preferred.providerType());
                    order.add(0, preferred.providerType());
                }
            } else {
                order.remove(preferred.providerType());
                order.add(0, preferred.providerType());
            }
        }
        return order;
    }
}

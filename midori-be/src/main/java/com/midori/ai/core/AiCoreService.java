package com.midori.ai.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.exception.AiProcessingException;
import com.midori.ai.impl.OpenRouterProvider.TemporaryFailureException;
import com.midori.ai.prompt.AiPromptBuilder;
import com.midori.ai.util.AiExistingQuestionParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Central AI orchestration service.
 *
 * <p>All AI operations MUST go through this service.
 * Business modules should NEVER call providers directly.
 *
 * <p>Features:
 * <ul>
 *   <li>Unified interface for all AI operations</li>
 *   <li>Automatic cross-provider fallback (configurable via {@code ai.provider-order})</li>
 *   <li>Transparent key rotation within each provider</li>
 *   <li>Centralized failure classification and safe logging</li>
 * </ul>
 */
@Slf4j
@Service
public class AiCoreService {

    private static volatile AiCoreService instance;
    private final AiProviderFactory providerFactory;
    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;

    public AiCoreService(AiProviderFactory providerFactory, AiConfigProperties config) {
        this.providerFactory = providerFactory;
        this.config = config;
        this.objectMapper = new ObjectMapper();
        instance = this;
    }

    @Autowired
    public AiCoreService(AiProviderFactory providerFactory, AiConfigProperties config, ObjectMapper objectMapper) {
        this.providerFactory = providerFactory;
        this.config = config;
        this.objectMapper = objectMapper;
        instance = this;
    }

    private static final ThreadLocal<Integer> providerCallCount = ThreadLocal.withInitial(() -> 0);
    private static final ThreadLocal<Long> requestStartTime = new ThreadLocal<>();
    public static final long MAX_REQUEST_DURATION_MS = 170000; // 170 seconds max hard deadline
    private static final int MAX_PROVIDER_INVOCATIONS = 20;
    private static final List<String> TEMPORARY_HTTP_CODES = List.of("429", "500", "502", "503", "504", "403");
    private static final ThreadLocal<Long> currentRequestBudgetMs = ThreadLocal.withInitial(() -> AiTimeoutPolicy.MAX_TOTAL_BUDGET_MS);
    public static final ThreadLocal<AiProviderStateManager.RouteInfo> lastSuccessfulRoute = new ThreadLocal<>();
    public static final ThreadLocal<Integer> currentBatchQuestionCount = ThreadLocal.withInitial(() -> 10);
    private static final ThreadLocal<com.midori.ai.AiTaskType> currentTaskType = new ThreadLocal<>();

    private static final ThreadLocal<Set<String>> attemptedKeys = ThreadLocal.withInitial(HashSet::new);
    public static final ThreadLocal<Integer> currentRound = ThreadLocal.withInitial(() -> 1);

    public record AttemptTrace(
        int generationRound,
        String provider,
        String model,
        String maskedKey,
        String httpCategory,
        String action,
        long elapsedTimeMs
    ) {}
    private static final ThreadLocal<List<AttemptTrace>> attemptTraces = ThreadLocal.withInitial(ArrayList::new);

    public record RouteMetadata(
        String provider,
        String model,
        int keyIndex,
        String maskedKey
    ) {}

    public record RequestFailure(
        RouteMetadata route,
        AiFailureKind kind
    ) {}

    private static final ThreadLocal<List<RequestFailure>> requestFailures =
            ThreadLocal.withInitial(ArrayList::new);

    private static final ThreadLocal<String> currentExecutingProvider = new ThreadLocal<>();
    private static final ThreadLocal<String> currentExecutingModel = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> isReadingTaskFlag = ThreadLocal.withInitial(() -> false);

    public static void recordRequestFailure(RouteMetadata route, AiFailureKind kind) {
        if (route != null && kind != null) {
            RequestFailure rf = new RequestFailure(route, kind);
            if (!requestFailures.get().contains(rf)) {
                requestFailures.get().add(rf);
                log.info("[AiCoreService] Recorded request-scoped failure: route={}, kind={}", route, kind);
            }
        }
    }

    public static boolean isRouteFailedInRequest(RouteMetadata route) {
        if (route == null) return false;
        return requestFailures.get().stream()
                .anyMatch(rf -> rf.route().provider().equalsIgnoreCase(route.provider())
                        && rf.route().model().equalsIgnoreCase(route.model())
                        && rf.route().keyIndex() == route.keyIndex()
                        && rf.route().maskedKey().equals(route.maskedKey()));
    }

    public static void setReadingTask(boolean value) {
        isReadingTaskFlag.set(value);
    }

    public static void setCurrentExecutingProvider(String provider) {
        currentExecutingProvider.set(provider);
    }

    public static void setCurrentExecutingModel(String model) {
        currentExecutingModel.set(model);
    }

    private static boolean hasOtherViableProvider(String currentProvider, AiTaskType taskType) {
        AiCoreService s = instance;
        if (s == null) return false;
        List<AiProviderType> order = s.getProviderOrder();
        for (AiProviderType type : order) {
            if (currentProvider != null && type.name().equalsIgnoreCase(currentProvider)) {
                continue;
            }
            try {
                AiProvider p = s.providerFactory.resolve(type);
                if (p.isConfigured() && p.hasAvailableRoute(taskType)) {
                    return true;
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    private boolean hasAnyViableRoute(List<AiProviderType> providers, AiTaskType taskType) {
        boolean anyViable = false;
        for (AiProviderType type : providers) {
            try {
                AiProvider p = providerFactory.resolve(type);
                if (!p.isConfigured()) {
                    log.debug("[AiCoreService] Provider {} is not configured.", type);
                    continue;
                }
                if (p.hasAvailableRoute(taskType)) {
                    anyViable = true;
                } else {
                    log.debug("[AiCoreService] Provider {} has no available routes for task={}", type, taskType);
                }
            } catch (Exception e) {
                log.warn("[AiCoreService] Exception during route viability check for provider={}, task={}: {}",
                        type, taskType, e.getMessage(), e);
                if (e instanceof IllegalStateException || e instanceof IllegalArgumentException) {
                    throw e;
                }
            }
        }
        return anyViable;
    }

    AiProcessingException failFastFailure(com.midori.ai.AiTaskType taskType) {
        List<RequestFailure> failures = requestFailures.get();
        List<String> codes = failures.stream()
                .map(rf -> {
                    if (rf.kind() == AiFailureKind.QUOTA) return "AI_QUOTA_EXHAUSTED";
                    if (rf.kind() == AiFailureKind.RATE_LIMIT) return "AI_RATE_LIMITED";
                    if (rf.kind() == AiFailureKind.TIMEOUT) return "AI_PROVIDER_TIMEOUT";
                    return "AI_PROVIDER_UNAVAILABLE";
                })
                .toList();

        StringBuilder sb = new StringBuilder("Fail-fast: No viable routes left for task ").append(taskType);
        for (RequestFailure rf : failures) {
            sb.append(String.format(" | %s(model=%s, key=%d): %s", rf.route().provider(), rf.route().model(), rf.route().keyIndex(), rf.kind()));
        }
        return buildExceptionFromCodes(codes, sb.toString());
    }

    public static void clearAttemptedKeys() {
        attemptedKeys.get().clear();
    }

    public static boolean isKeyAttempted(String keyId) {
        if (keyId == null) return false;
        return attemptedKeys.get().contains(keyId);
    }

    public static void markKeyAttempted(String keyId) {
        if (keyId != null) {
            attemptedKeys.get().add(keyId);
        }
    }

    public static void clearAttemptTraces() {
        attemptTraces.get().clear();
    }

    public static List<AttemptTrace> getAttemptTraces() {
        return new ArrayList<>(attemptTraces.get());
    }

    public static void recordAttemptTrace(String provider, String model, String maskedKey, String httpCategory, String action, long elapsedTimeMs) {
        attemptTraces.get().add(new AttemptTrace(
            currentRound.get(),
            provider,
            model,
            maskedKey,
            httpCategory,
            action,
            elapsedTimeMs
        ));
    }

    public static void resetProviderCallCount() {
        providerCallCount.set(0);
    }

    public static int getProviderCallCount() {
        return providerCallCount.get();
    }

    public static void startRequestTimer() {
        requestStartTime.set(System.currentTimeMillis());
        log.info("[AiCoreService] Request timer started at {}", requestStartTime.get());
    }

    public static void clearRequestTimer() {
        requestStartTime.remove();
        attemptedKeys.remove();
        currentRound.remove();
        attemptTraces.remove();
        currentRequestBudgetMs.remove();
        lastSuccessfulRoute.remove();
        currentBatchQuestionCount.remove();
        currentTaskType.remove();
        requestFailures.remove();
        currentExecutingProvider.remove();
        currentExecutingModel.remove();
        isReadingTaskFlag.remove();
        log.info("[AiCoreService] Request timer cleared");
    }

    public static void setCurrentTaskType(com.midori.ai.AiTaskType type) {
        if (type != null) {
            currentTaskType.set(type);
        } else {
            currentTaskType.remove();
        }
    }

    public static com.midori.ai.AiTaskType getCurrentTaskType() {
        return currentTaskType.get();
    }

    public static Long getRequestStartTime() {
        return requestStartTime.get();
    }

    public static void setRequestQuestionCount(int count) {
        long budget = AiTimeoutPolicy.calculateTotalRequestBudgetMs(count);
        currentRequestBudgetMs.set(budget);
        log.debug("[AiCoreService] Set dynamic request budget to {}ms for count={}", budget, count);
    }

    public static long getRemainingTotalBudgetMs() {
        Long start = requestStartTime.get();
        if (start == null) return currentRequestBudgetMs.get();
        long elapsed = System.currentTimeMillis() - start;
        return Math.max(0, currentRequestBudgetMs.get() - elapsed);
    }

    public static boolean canStartProviderCall() {
        return AiTimeoutPolicy.hasEnoughBudget(getRemainingTotalBudgetMs());
    }

    public static void checkTimeout() {
        Long start = requestStartTime.get();
        if (start != null) {
            long elapsed = System.currentTimeMillis() - start;
            if (elapsed >= currentRequestBudgetMs.get()) {
                log.warn("[AiCoreService] Hard deadline request timeout reached (elapsed: {}ms)", elapsed);
                if (instance != null && !requestFailures.get().isEmpty()) {
                    throw instance.failFastFailure(getCurrentTaskType());
                }
                throw new com.midori.exception.AiException.RequestTimeoutException(
                        "The request exceeded the maximum processing time.");
            }
        }
    }

    public static long getRemainingTimeoutMs(long defaultTimeoutMs) {
        return getRemainingTimeoutMs(defaultTimeoutMs, currentTaskType.get());
    }

    public static long getRemainingTimeoutMs(long defaultTimeoutMs, com.midori.ai.AiTaskType taskType) {
        com.midori.ai.AiTaskType effectiveTaskType = taskType != null ? taskType : currentTaskType.get();
        boolean isQuestionGen = AiTimeoutPolicy.isQuestionGenerationTask(effectiveTaskType);

        Long start = requestStartTime.get();
        if (start == null) {
            if (isQuestionGen) {
                return Math.max(defaultTimeoutMs, AiTimeoutPolicy.MAX_PROVIDER_TIMEOUT_MS);
            }
            return defaultTimeoutMs;
        }
        long remaining = getRemainingTotalBudgetMs();
        if (remaining <= AiTimeoutPolicy.SAFETY_MARGIN_MS) {
            return 1; // trigger immediate timeout
        }
        long policyTimeout = AiTimeoutPolicy.calculateProviderTimeoutMs(currentBatchQuestionCount.get(), remaining, effectiveTaskType);
        if (isQuestionGen) {
            boolean shouldCap = false;
            if (effectiveTaskType == com.midori.ai.AiTaskType.COMPLEX_REASONING && !Boolean.TRUE.equals(isReadingTaskFlag.get())) {
                String curProvider = currentExecutingProvider.get();
                String curModel = currentExecutingModel.get();
                boolean otherViable = hasOtherViableProvider(curProvider, effectiveTaskType);
                boolean isSlowFree = curProvider != null && curProvider.equalsIgnoreCase("OPENROUTER")
                        && curModel != null && curModel.toLowerCase().contains("free");
                if (otherViable || isSlowFree) {
                    shouldCap = true;
                }
            }
            long boundedTimeout = shouldCap ? Math.min(policyTimeout, 60000L) : policyTimeout;
            return Math.max(1L, boundedTimeout);
        }
        // Keep shorter configured timeouts for unrelated lightweight chat tasks
        return Math.min(defaultTimeoutMs, policyTimeout);
    }

    // ============================================================
    // Cross-Provider Orchestration
    // ============================================================

    /**
     * Parse the configured provider order string into a list of provider types.
     */
    private List<AiProviderType> getProviderOrder() {
        String orderStr = config.getProviderOrder();
        if (orderStr == null || orderStr.isBlank()) {
            return List.of(AiProviderType.GEMINI, AiProviderType.OPENROUTER);
        }
        List<AiProviderType> result = new ArrayList<>();
        for (String token : orderStr.split(",")) {
            String trimmed = token.trim().toUpperCase();
            if (!trimmed.isEmpty()) {
                try {
                    result.add(AiProviderType.valueOf(trimmed));
                } catch (IllegalArgumentException e) {
                    log.warn("[AiCoreService] Unknown provider in provider-order: '{}'", trimmed);
                }
            }
        }
        if (result.isEmpty()) {
            return List.of(AiProviderType.GEMINI, AiProviderType.OPENROUTER);
        }
        return result;
    }

    /**
     * Send a chat message using a specific AI provider type (e.g. GEMINI for Kanji/Shadowing translation).
     */
    public String chatWithProvider(AiProviderType providerType, String systemPrompt, String userMessage, List<String[]> history) {
        AiProvider provider = providerFactory.resolveOrDefault(providerType);
        return provider.chat(systemPrompt, userMessage, history, com.midori.ai.AiTaskType.COMPLEX_REASONING);
    }

    /**
     * Classify whether an exception represents a temporary/provider failure that
     * warrants trying the next provider, or a permanent configuration/application
     * error that should not cross providers.
     *
     * <p>Temporary failures trigger fallback:
     * <ul>
     *   <li>HTTP 429 — rate limit</li>
     *   <li>HTTP 500/502/503/504 — upstream/server errors</li>
     *   <li>timeout / network errors</li>
     *   <li>Provider-specific temporary errors</li>
     * </ul>
     *
     * <p>Permanent failures do NOT trigger fallback:
     * <ul>
     *   <li>API_KEY_INVALID / auth errors</li>
     *   <li>HTTP 400 Bad Request caused by application code</li>
     *   <li>Validation/DTO errors</li>
     *   <li>Malformed request from MIDORI</li>
     *   <li>AIProcessingException with business-logic messages</li>
     * </ul>
     */
    private boolean isTemporaryFailure(Throwable t) {
        if (t == null) return false;

        // Check our custom AiExceptions
        if (t instanceof com.midori.exception.AiException ae) {
            if (ae instanceof com.midori.exception.AiException.InvalidResponseException ||
                ae instanceof com.midori.exception.AiException.RequestTimeoutException ||
                ae instanceof com.midori.exception.AiException.ProviderCallLimitReachedException) {
                return false;
            }
            // InvalidApiKeyException and ProviderForbiddenException are safe to fall back across different providers
            return true;
        }

        // Explicit type check — this takes priority over message parsing.
        if (t instanceof TemporaryFailureException) return true;

        // Check the root cause for HTTP status codes
        Throwable root = t;
        while (root != null && !(root instanceof org.springframework.web.client.HttpClientErrorException)
                && !(root instanceof com.fasterxml.jackson.core.JsonProcessingException)) {
            root = root.getCause();
        }
        if (root instanceof org.springframework.web.client.HttpClientErrorException hce) {
            int code = hce.getStatusCode().value();
            // 429/500/502/503/504 = temporary across all providers
            if (code == 429 || code == 500 || code == 502 || code == 503 || code == 504) return true;
            // 403 can be rate-limit / temporary quota restriction
            if (code == 403) return true;
        }

        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";

        // HTTP status codes in message text — temporary
        for (String codeStr : TEMPORARY_HTTP_CODES) {
            if (msg.contains(codeStr)) return true;
        }

        // Network / timeout keywords — temporary
        if (msg.contains("timeout") || msg.contains("connection") || msg.contains("network")
                || msg.contains("unavailable") || msg.contains("rate limit") || msg.contains("quota")
                || msg.contains("too many requests") || msg.contains("service unavailable")
                || msg.contains("upstream error") || msg.contains("resource has been exhausted")
                || msg.contains("all gemini") || msg.contains("exhausted")) {
            return true;
        }

        // Model not found keywords — temporary (try next model/provider)
        if (msg.contains("model not found") || msg.contains("model unavailable") || msg.contains("model does not exist")) {
            return true;
        }

        // Permanent failure indicators — do NOT fallback across providers
        if (msg.contains("api_key_invalid") || msg.contains("invalid api key")
                || msg.contains("api key not valid") || msg.contains("unauthorized")
                || msg.contains("authentication") || msg.contains("validation")
                || msg.contains("invalid request") || msg.contains("malformed request")
                || msg.contains("bad request") || msg.contains("dto")
                || msg.contains("illegalargument") || msg.contains("not configured")
                || msg.contains("no content") || msg.contains("forbidden")) {
            return false;
        }

        return false;
    }

    /**
     * Try a provider operation, returning on the first success, or falling back
     * to the next provider in the configured order for temporary failures.
     *
     * @param taskType  Human-readable task name for logging (e.g. "chat", "question-generation")
     * @param operation The callable operation on a provider
     * @return The successful result string
     * @throws AiProcessingException wrapped final error after all providers exhausted
     */
    public record AiResponse(
        String content,
        String providerName,
        String modelName,
        String finishReason,
        Integer promptTokens,
        Integer completionTokens,
        Integer totalTokens
    ) {}

    private String executeWithFallback(String taskType, ProviderOperation operation) throws AiProcessingException {
        return executeWithFallbackDetailed(taskType, operation).content();
    }

    private AiResponse executeWithFallbackDetailed(String taskType, ProviderOperation operation) throws AiProcessingException {
        checkTimeout();
        int invocations = providerCallCount.get();
        if (invocations >= MAX_PROVIDER_INVOCATIONS) {
            log.warn("[AiCoreService] Hard safety limit of {} provider invocations reached. Aborting.", MAX_PROVIDER_INVOCATIONS);
            throw new com.midori.exception.AiException.ProviderCallLimitReachedException("Provider call limit exceeded");
        }
        providerCallCount.set(invocations + 1);

        try {
            com.midori.ai.AiTaskType enumTaskType = mapStringToTaskType(taskType);
            setCurrentTaskType(enumTaskType);
            List<AiProviderType> order = AiProviderStateManager.reorderProviders(getProviderOrder(), enumTaskType);
            List<ProviderFailure> allFailures = new ArrayList<>();

            if (!hasAnyViableRoute(order, enumTaskType)) {
                log.warn("[AiCoreService] Fail-fast: No viable provider/model/key route is available for task={}", enumTaskType);
                throw failFastFailure(enumTaskType);
            }

            // Reset key-attempts for this provider failover operation round
            attemptedKeys.get().clear();

            for (AiProviderType providerType : order) {
                checkTimeout();
                if (!canStartProviderCall()) {
                    log.warn("[AiCoreService] Insufficient remaining request budget ({}ms left). Stopping provider failover.", getRemainingTotalBudgetMs());
                    if (!requestFailures.get().isEmpty()) {
                        throw failFastFailure(enumTaskType);
                    }
                    throw new com.midori.exception.AiException.RequestTimeoutException("The request exceeded the maximum processing time.");
                }

                currentExecutingProvider.set(providerType.name());

                AiProvider provider;
                try {
                    provider = providerFactory.resolve(providerType);
                } catch (Exception resolveEx) {
                    log.debug("[AiCoreService] Provider {} not available: {}", providerType, resolveEx.getMessage());
                    if (resolveEx instanceof IllegalStateException || resolveEx instanceof IllegalArgumentException) {
                        throw resolveEx;
                    }
                    continue;
                }

                if (!provider.isConfigured()) {
                    log.debug("[AiCoreService] Provider {} not configured, skipping", providerType);
                    continue;
                }

                String model = provider.getLastModelUsed();
                if (model == null) model = provider.getModels().isEmpty() ? "unknown" : provider.getModels().get(0);

                log.info("[AiCoreService] Attempting task={} with provider={} (model={}) in round={}", taskType, providerType, model, currentRound.get());

                try {
                    String result = operation.execute(provider);
                    String actualModel = provider.getLastModelUsed();
                    if (actualModel == null) actualModel = model;
                    log.info("[AiCoreService] SUCCESS — task={} provider={} model={}", taskType, providerType, actualModel);
                    lastSuccessfulRoute.set(new AiProviderStateManager.RouteInfo(providerType, actualModel, provider.getLastKeyIndex(), provider.getLastKeyId()));
                    return new AiResponse(
                            result,
                            provider.getName(),
                            actualModel,
                            provider.getLastFinishReason(),
                            provider.getLastPromptTokens(),
                            provider.getLastCompletionTokens(),
                            provider.getLastTotalTokens()
                    );
                } catch (Throwable t) {
                    boolean temporary = isTemporaryFailure(t);
                    String reason = t.getMessage() != null ? t.getMessage() : t.getClass().getSimpleName();
                    allFailures.add(new ProviderFailure(providerType, model, reason, temporary, t));
                    if (temporary) {
                        log.warn("[AiCoreService] task={} provider={} failed TEMPORARILY ({}) — falling back to next provider",
                                taskType, providerType, reason);
                    } else {
                        log.warn("[AiCoreService] task={} provider={} failed PERMANENTLY ({}) — NOT falling back across providers",
                                taskType, providerType, reason);
                        // Aggregate all failures into final exception
                        throw wrapFailure(taskType, allFailures);
                    }
                }
            }

            throw wrapFailure(taskType, allFailures);
        } finally {
            try {
                for (AiProvider p : providerFactory.getAllAvailable()) {
                    p.clearMetrics();
                }
            } catch (Exception clearEx) {
                log.debug("[AiCoreService] Failed to clear metrics: {}", clearEx.getMessage());
            }
        }
    }

    public static com.midori.ai.AiTaskType mapStringToTaskType(String taskStr) {
        if (taskStr == null) return com.midori.ai.AiTaskType.DEFAULT;
        for (com.midori.ai.AiTaskType type : com.midori.ai.AiTaskType.values()) {
            if (taskStr.contains(type.name())) {
                return type;
            }
        }
        String s = taskStr.toLowerCase();
        if (s.contains("admin") || s.contains("library")) {
            return com.midori.ai.AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION;
        }
        if (s.contains("question-generation") || s.contains("writing") || s.contains("quiz") || s.contains("reasoning")) {
            return com.midori.ai.AiTaskType.COMPLEX_REASONING;
        }
        if (s.contains("parse") || s.contains("document") || s.contains("ocr") || s.contains("exam") || s.contains("import") || s.contains("pdf")) {
            return com.midori.ai.AiTaskType.LONG_DOCUMENT_ANALYSIS;
        }
        return com.midori.ai.AiTaskType.DEFAULT;
    }

    private String getErrorCode(Throwable t) {
        Throwable curr = t;
        while (curr != null) {
            if (curr instanceof com.midori.exception.AiException ae) {
                return ae.getCode();
            }
            curr = curr.getCause();
        }
        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";
        if (msg.contains("429") || msg.contains("quota") || msg.contains("exhausted") || msg.contains("too many requests")) {
            return "AI_QUOTA_EXHAUSTED";
        }
        if (msg.contains("rate limit") || msg.contains("cooldown")) {
            return "AI_RATE_LIMITED";
        }
        if (msg.contains("timeout") || msg.contains("time out")) {
            return "AI_PROVIDER_TIMEOUT";
        }
        if (msg.contains("unauthorized") || msg.contains("auth") || msg.contains("api key is invalid") || msg.contains("api_key_invalid")) {
            return "AI_INVALID_API_KEY";
        }
        if (msg.contains("forbidden")) {
            return "AI_PROVIDER_FORBIDDEN";
        }
        return "AI_PROVIDER_UNAVAILABLE";
    }

    private AiProcessingException wrapFailure(String taskType, List<ProviderFailure> failures) {
        // Look for custom AiExceptions to propagate directly
        for (ProviderFailure f : failures) {
            if (f.exception instanceof com.midori.exception.AiException.ProviderCallLimitReachedException) {
                return (com.midori.exception.AiException.ProviderCallLimitReachedException) f.exception;
            }
        }

        List<String> codes = new ArrayList<>();
        for (ProviderFailure f : failures) {
            codes.add(getErrorCode(f.exception));
        }

        StringBuilder sb = new StringBuilder("All AI providers failed for task: ").append(taskType);
        for (ProviderFailure f : failures) {
            sb.append(String.format(" | %s(model=%s): %s [%s]",
                    f.provider, f.model, f.reason, f.temporary ? "temp" : "permanent"));
        }
        String finalMsg = sb.toString();

        return buildExceptionFromCodes(codes, finalMsg);
    }

    private static AiProcessingException buildExceptionFromCodes(List<String> codes, String finalMsg) {
        if (codes.isEmpty()) {
            return new com.midori.exception.AiException.ProviderUnavailableException(finalMsg);
        }

        boolean hasQuota = codes.contains("AI_QUOTA_EXHAUSTED");
        boolean hasRateLimit = codes.contains("AI_RATE_LIMITED");
        boolean hasTimeout = codes.contains("AI_PROVIDER_TIMEOUT");
        boolean hasMalformed = codes.contains("AI_INVALID_RESPONSE");

        long distinctCount = codes.stream().distinct().count();

        if (distinctCount == 1 && hasQuota) {
            return new com.midori.exception.AiException.QuotaExhaustedException(finalMsg);
        }
        if (distinctCount == 1 && hasRateLimit) {
            return new com.midori.exception.AiException.RateLimitedException(finalMsg);
        }
        if (distinctCount == 2 && hasQuota && hasRateLimit) {
            return new com.midori.exception.AiException.ProviderUnavailableException(finalMsg);
        }
        if (distinctCount == 1 && hasTimeout) {
            return new com.midori.exception.AiException.ProviderTimeoutException(finalMsg);
        }
        if ((hasQuota || hasRateLimit) && hasTimeout) {
            return new com.midori.exception.AiException.ProviderUnavailableException(
                "AI providers are temporarily unavailable due to quota limits or provider timeout. Please try again later. Detail: " + finalMsg);
        }
        if (distinctCount == 1 && hasMalformed) {
            return new com.midori.exception.AiException.InvalidResponseException(finalMsg);
        }

        if (codes.stream().allMatch("AI_INVALID_API_KEY"::equals)) {
            return new com.midori.exception.AiException.InvalidApiKeyException(finalMsg);
        }
        if (codes.stream().allMatch("AI_PROVIDER_FORBIDDEN"::equals)) {
            return new com.midori.exception.AiException.ProviderForbiddenException(finalMsg);
        }

        return new com.midori.exception.AiException.ProviderUnavailableException(finalMsg);
    }

    public static AiFailureKind classify429(String body) {
        if (body == null) return AiFailureKind.RATE_LIMIT;
        String bodyLower = body.toLowerCase();
        if (bodyLower.contains("quota exhausted") || bodyLower.contains("free_tier_requests")
            || bodyLower.contains("free-models-per-day") || bodyLower.contains("resource_exhausted")
            || bodyLower.contains("free tier quota") || bodyLower.contains("quota exceeded")
            || bodyLower.contains("exhausted your current quota")) {
            return AiFailureKind.QUOTA;
        }
        return AiFailureKind.RATE_LIMIT;
    }

    private record ProviderFailure(AiProviderType provider, String model, String reason, boolean temporary, Throwable exception) {}
    @FunctionalInterface
    private interface ProviderOperation { String execute(AiProvider provider) throws Exception; }

    // ============================================================
    // Chat / Conversation
    // ============================================================

    public String chat(String systemPrompt, String userMessage, List<String[]> history) {
        return chat(systemPrompt, userMessage, history, AiTaskType.COMPLEX_REASONING);
    }

    public String chat(String systemPrompt, String userMessage, List<String[]> history, AiTaskType taskType) {
        AiTaskType effectiveType = taskType != null ? taskType : AiTaskType.COMPLEX_REASONING;
        return executeWithFallback("chat:" + effectiveType.name(), (provider) ->
                provider.chat(systemPrompt, userMessage, history, effectiveType));
    }

    public AiResponse chatWithDetails(String systemPrompt, String userMessage, List<String[]> history, AiTaskType taskType) {
        AiTaskType effectiveType = taskType != null ? taskType : AiTaskType.COMPLEX_REASONING;
        return executeWithFallbackDetailed("chat:" + effectiveType.name(), (provider) ->
                provider.chat(systemPrompt, userMessage, history, effectiveType));
    }

    public String chatWithMaterial(String materialTitle, String materialType,
                                  String materialLevel, String materialContent,
                                  String userMessage, List<String[]> history) {
        String systemPrompt = AiPromptBuilder.buildChatSystemPromptWithMaterial(
                materialTitle, materialType, materialLevel, materialContent);
        return chat(systemPrompt, userMessage, history);
    }

    // ============================================================
    // Question Generation
    // ============================================================

    public String generateQuestions(String topic, String materialContent,
                                   int count, String type, String difficulty,
                                   java.util.List<String> selectedSkills) {
        return executeWithFallback("question-generation", (provider) ->
                provider.generateQuestions(topic, materialContent, count, type, difficulty,
                        selectedSkills, AiTaskType.COMPLEX_REASONING));
    }

    public String generateQuestionsWithDistribution(String topic, String materialContent,
                                                   int distributionTotal, String questionType,
                                                   String distributionLine,
                                                   java.util.List<String> selectedSkills) {
        return executeWithFallback("question-generation-dist", (provider) ->
                provider.generateQuestionsWithDistribution(
                        topic, materialContent, distributionTotal, questionType,
                        distributionLine, selectedSkills,
                        AiTaskType.COMPLEX_REASONING));
    }

    public String generateQuestions(String topic, String materialContent,
                                   int count, String type, String difficulty) {
        return generateQuestions(topic, materialContent, count, type, difficulty, null);
    }

    /**
     * Generate questions in multiple formats simultaneously.
     */
    public String generateMultiFormatQuestions(String topic, String materialContent,
                                              int distributionTotal, String distributionLine,
                                              java.util.List<String> selectedSkills,
                                              java.util.List<String> selectedFormats) {
        return executeWithFallback("question-generation-multi-format", (provider) ->
                provider.generateMultiFormatQuestions(
                        topic, materialContent, distributionTotal, distributionLine,
                        selectedSkills, selectedFormats, AiTaskType.COMPLEX_REASONING));
    }

    public String generateQuestionsWithSourceRecords(
            String topic, int count, String type, String difficulty,
            List<String> selectedSkills, String sourceRecordsText) {
        String systemPrompt = "You are AI Sensei of MIDORI, a Japanese tutor for Vietnamese learners. You output ONLY valid JSON.";
        String userPrompt = AiPromptBuilder.buildQuizGenerationPromptWithSourceRecords(
                topic, count, type, difficulty, selectedSkills, sourceRecordsText);
        return chat(systemPrompt, userPrompt, null, AiTaskType.COMPLEX_REASONING);
    }

    public String generateQuestionsWithDistributionAndSourceRecords(
            String topic, int distributionTotal, String questionType,
            String distributionLine, List<String> selectedSkills, String sourceRecordsText) {
        String systemPrompt = "You are AI Sensei of MIDORI, a Japanese tutor for Vietnamese learners. You output ONLY valid JSON.";
        String userPrompt = AiPromptBuilder.buildQuizGenerationPromptWithDistributionAndSourceRecords(
                topic, distributionTotal, questionType, distributionLine, selectedSkills, sourceRecordsText);
        return chat(systemPrompt, userPrompt, null, AiTaskType.COMPLEX_REASONING);
    }

    public String generateWritingQuestions(String content, int count, String level, String distributionLine, com.midori.ai.dto.WritingMode writingMode) {
        String systemPrompt = "You are AI Sensei of MIDORI, a Japanese writing tutor for Vietnamese learners. You output ONLY valid JSON without markdown fences.";
        String userPrompt = com.midori.ai.prompt.AiWritingPromptBuilder.buildWritingPrompt(content, count, level, distributionLine, writingMode);
        return chat(systemPrompt, userPrompt, null, AiTaskType.COMPLEX_REASONING);
    }

    // ============================================================
    // Exam Parsing (PDF)
    // ============================================================

    public AiExamParseResponse parseExam(String extractedText, String filename)
            throws AiProcessingException {
        return executeWithFallbackExam("exam-parsing", extractedText, filename, AiTaskType.LONG_DOCUMENT_ANALYSIS);
    }

    public AiExamParseResponse parseExistingQuestionsFromText(String extractedText, String filename,
                                                               List<String> selectedSkills)
            throws AiProcessingException {
        if (extractedText == null || extractedText.isBlank()) {
            throw new AiProcessingException("Cannot parse empty PDF text.");
        }

        String systemPrompt = "You are an exam-digitization assistant. "
                + "You always reply with a single valid JSON object. "
                + "Never include markdown fences or commentary around the JSON.";

        String skillsParam = null;
        if (selectedSkills != null && !selectedSkills.isEmpty()) {
            skillsParam = String.join(",", selectedSkills);
        }
        String userPrompt = AiPromptBuilder.buildExistingQuestionsParsingPrompt(extractedText, filename, skillsParam);

        String raw = executeWithFallback("import-existing-questions", (provider) ->
                provider.chat(systemPrompt, userPrompt, null, AiTaskType.LONG_DOCUMENT_ANALYSIS));

        if (raw == null || raw.isBlank()) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] Provider returned empty body");
            return AiExamParseResponse.empty();
        }

        log.info("[AiCoreService.parseExistingQuestionsFromText] Provider returned {} chars", raw.length());

        try {
            return parseExamResponseFromChat(raw);
        } catch (AiProcessingException e) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] AI JSON parse failed ({}). "
                    + "Falling back to rule-based parser.", e.getMessage());
            AiExamParseResponse fallbackResult = AiExistingQuestionParser.parseFromSourceText(extractedText);
            if (fallbackResult.getQuestions() != null && !fallbackResult.getQuestions().isEmpty()) {
                log.info("[AiCoreService.parseExistingQuestionsFromText] Rule-based fallback extracted {} questions",
                        fallbackResult.getQuestions().size());
                return fallbackResult;
            }
            throw new AiProcessingException(
                    "AI could not parse the PDF content, and rule-based fallback also found no questions. "
                    + "Please check that the PDF contains readable multiple-choice questions with labeled options (A/B/C/D).", e);
        } catch (Exception e) {
            log.warn("[AiCoreService.parseExistingQuestionsFromText] Unexpected parse failure ({}). "
                    + "Falling back to rule-based parser.", e.getMessage());
            AiExamParseResponse fallbackResult = AiExistingQuestionParser.parseFromSourceText(extractedText);
            if (fallbackResult.getQuestions() != null && !fallbackResult.getQuestions().isEmpty()) {
                log.info("[AiCoreService.parseExistingQuestionsFromText] Rule-based fallback extracted {} questions",
                        fallbackResult.getQuestions().size());
                return fallbackResult;
            }
            throw new AiProcessingException(
                    "AI response was not parseable, and rule-based fallback also found no questions. "
                    + "Please check that the PDF contains readable multiple-choice questions.", e);
        }
    }

    private AiExamParseResponse executeWithFallbackExam(String taskType, String extractedText,
                                                         String filename, AiTaskType aiTaskType)
            throws AiProcessingException {
        setCurrentTaskType(aiTaskType);
        List<AiProviderType> order = getProviderOrder();
        List<ProviderFailure> allFailures = new ArrayList<>();

        for (AiProviderType providerType : order) {
            checkTimeout();
            if (!canStartProviderCall()) {
                log.warn("[AiCoreService] Insufficient remaining request budget ({}ms left). Stopping exam failover.", getRemainingTotalBudgetMs());
                throw new com.midori.exception.AiException.RequestTimeoutException("The request exceeded the maximum processing time.");
            }
            AiProvider provider;
            try {
                provider = providerFactory.resolve(providerType);
            } catch (Exception resolveEx) {
                continue;
            }

            if (!provider.isConfigured()) continue;

            String model = provider.getLastModelUsed();
            if (model == null) model = provider.getModels().isEmpty() ? "unknown" : provider.getModels().get(0);

            log.info("[AiCoreService] Attempting task={} with provider={} (model={})", taskType, providerType, model);

            try {
                AiExamParseResponse result = provider.parseExamFromText(extractedText, filename, aiTaskType);
                log.info("[AiCoreService] SUCCESS — task={} provider={} model={}", taskType, providerType, model);
                return result;
            } catch (Throwable t) {
                boolean temporary = isTemporaryFailure(t);
                String reason = t.getMessage() != null ? t.getMessage() : t.getClass().getSimpleName();
                allFailures.add(new ProviderFailure(providerType, model, reason, temporary, t));
                if (temporary) {
                    log.warn("[AiCoreService] task={} provider={} failed TEMPORARILY ({}) — falling back",
                            taskType, providerType, reason);
                } else {
                    log.warn("[AiCoreService] task={} provider={} failed PERMANENTLY ({}) — NOT falling back",
                            taskType, providerType, reason);
                    throw wrapFailure(taskType, allFailures);
                }
            }
        }

        throw wrapFailure(taskType, allFailures);
    }

    private AiExamParseResponse parseExamResponseFromChat(String raw) throws AiProcessingException {
        try {
            return AiExistingQuestionParser.parseAndNormalize(raw, this.objectMapper);
        } catch (IllegalArgumentException e) {
            log.warn("[AiCoreService] AI JSON parse failed ({}). First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            throw new AiProcessingException("AI response was not parseable as the expected questions JSON.");
        } catch (Exception e) {
            log.warn("[AiCoreService] AI JSON parse failed unexpectedly: {}. First 200 chars: {}",
                    e.getMessage(), abbreviate(AiExistingQuestionParser.cleanJsonResponse(raw), 200));
            throw new AiProcessingException("AI response was not parseable as the expected questions JSON.");
        }
    }

    private static String abbreviate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "…";
    }

    // ============================================================
    // Provider Information
    // ============================================================

    /**
     * Get the currently configured provider (legacy — prefer checking providerOrder).
     */
    public AiProvider getCurrentProvider() {
        return providerFactory.resolve();
    }

    public List<AiProvider> getAllProviders() {
        return providerFactory.getAllAvailable();
    }

    public String getStatus() {
        StringBuilder sb = new StringBuilder();
        sb.append("AI Core Status:\n");
        sb.append("  Provider order: ").append(config.getProviderOrder()).append("\n");

        for (AiProvider p : providerFactory.getAllAvailable()) {
            sb.append(String.format("  - %s: %s\n",
                    p.getName(),
                    p.isConfigured() ? "configured" : "NOT CONFIGURED"));
        }

        AiProvider current = providerFactory.resolve();
        sb.append(String.format("  Current provider: %s\n", current.getName()));

        return sb.toString();
    }
}

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
@RequiredArgsConstructor
public class AiCoreService {

    private final AiProviderFactory providerFactory;
    private final AiConfigProperties config;

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

        // Explicit type check — this takes priority over message parsing.
        // TemporaryFailureException is thrown by OpenRouterProvider when all
        // models/keys are temporarily unavailable (timeouts, 429s), even when
        // the wrapped message doesn't contain a recognizable keyword.
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
            // 403 from Gemini can be rate-limit (not auth) — treat as temporary
            if (code == 403) return true;
        }

        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";

        // HTTP status codes in message text — temporary
        for (int code : List.of(429, 500, 502, 503, 504, 403)) {
            if (msg.contains(String.valueOf(code))) return true;
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
        try {
            List<AiProviderType> order = getProviderOrder();
            List<ProviderFailure> allFailures = new ArrayList<>();

            for (AiProviderType providerType : order) {
                AiProvider provider;
                try {
                    provider = providerFactory.resolve(providerType);
                } catch (Exception resolveEx) {
                    log.debug("[AiCoreService] Provider {} not available: {}", providerType, resolveEx.getMessage());
                    continue;
                }

                if (!provider.isConfigured()) {
                    log.debug("[AiCoreService] Provider {} not configured, skipping", providerType);
                    continue;
                }

                String model = provider.getLastModelUsed();
                if (model == null) model = provider.getModels().isEmpty() ? "unknown" : provider.getModels().get(0);

                log.info("[AiCoreService] Attempting task={} with provider={} (model={})", taskType, providerType, model);

                try {
                    String result = operation.execute(provider);
                    String actualModel = provider.getLastModelUsed();
                    if (actualModel == null) actualModel = model;
                    log.info("[AiCoreService] SUCCESS — task={} provider={} model={}", taskType, providerType, actualModel);
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
                    allFailures.add(new ProviderFailure(providerType, model, reason, temporary));
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

    private AiProcessingException wrapFailure(String taskType, List<ProviderFailure> failures) {
        StringBuilder sb = new StringBuilder("All AI providers failed for task: ").append(taskType);
        for (ProviderFailure f : failures) {
            sb.append(String.format(" | %s(model=%s): %s [%s]",
                    f.provider, f.model, f.reason, f.temporary ? "temp" : "permanent"));
        }
        return new AiProcessingException(sb.toString());
    }

    private record ProviderFailure(AiProviderType provider, String model, String reason, boolean temporary) {}
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
        List<AiProviderType> order = getProviderOrder();
        List<ProviderFailure> allFailures = new ArrayList<>();

        for (AiProviderType providerType : order) {
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
                allFailures.add(new ProviderFailure(providerType, model, reason, temporary));
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
        ObjectMapper mapper = new ObjectMapper();
        try {
            return AiExistingQuestionParser.parseAndNormalize(raw, mapper);
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

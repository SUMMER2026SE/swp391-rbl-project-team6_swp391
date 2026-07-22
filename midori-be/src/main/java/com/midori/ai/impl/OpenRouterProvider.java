package com.midori.ai.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.AiParsingException;
import com.midori.ai.key.OpenRouterKeyManager;
import com.midori.ai.prompt.AiPromptBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Unified OpenRouter Provider implementing AiProvider interface.
 * 
 * Supports:
 * - Chat/Conversation
 * - Question Generation
 * - Exam Parsing (PDF)
 * - Multiple models with automatic fallback
 * 
 * Migrated from OpenRouterAiProvider with improved error handling.
 */
@Slf4j
@Component
public class OpenRouterProvider implements AiProvider {

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    private static final int DEFAULT_CHAT_TIMEOUT_MS = 45000;
    private static final int DEFAULT_QUIZ_TIMEOUT_MS = 60000;
    private static final int DEFAULT_CONNECT_TIMEOUT_MS = 5000;

    private static final int DEFAULT_CHAT_MAX_TOKENS = 4096;
    private static final int DEFAULT_QUIZ_MAX_TOKENS = 4096;

    private static final double DEFAULT_STUDY_TEMPERATURE = 0.25;
    private static final double DEFAULT_QUIZ_TEMPERATURE = 0.25;

    /**
     * Models that have been observed to be consistently broken.
     */
    private static final List<String> KNOWN_BAD_MODELS = List.of(
            "deepseek/deepseek-chat-v3-0324:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            // 2026-07-19: openai/gpt-oss-120b:free was retired from the
            // free tier by OpenRouter. The paid slug is openai/gpt-oss-120b.
            // Hard-coding it here ensures the chain builder skips it even
            // when example/local configs still reference it.
            "openai/gpt-oss-120b:free"
    );

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final OpenRouterKeyManager keyManager;
    private final String referer;
    private final String appTitle;

    private final List<String> chatModels;
    private final List<String> quizModels;

    private final int chatTimeoutMs;
    private final int quizTimeoutMs;
    private final int chatMaxTokens;
    private final int quizMaxTokens;

    private volatile String lastModelUsed;
    private final ThreadLocal<String> lastFinishReason = new ThreadLocal<>();
    private final ThreadLocal<Integer> lastPromptTokens = new ThreadLocal<>();
    private final ThreadLocal<Integer> lastCompletionTokens = new ThreadLocal<>();
    private final ThreadLocal<Integer> lastTotalTokens = new ThreadLocal<>();
    private final ThreadLocal<Boolean> benchmarkObservationEnabled = new ThreadLocal<>();
    private final ThreadLocal<ChatObservation> lastChatObservation = new ThreadLocal<>();

    /**
     * Internal chat-call observation used by the benchmark test bridge. This is
     * intentionally not part of {@link AiProvider}'s public production contract.
     */
    static final class ChatObservation {
        private final String provider;
        private final String requestedModel;
        private final String actualResolvedModel;
        private final String fallbackModelUsed;
        private final boolean fallbackOccurred;
        private final String finishReason;
        private final long latencyMs;
        private final int errorOrRetryCount;
        private final Long promptTokens;
        private final Long completionTokens;
        private final Long totalTokens;
        private final String rawHttpResponse;
        private final String rawHttpResponseBase64;
        private final String error;

        ChatObservation(
                String provider,
                String requestedModel,
                String actualResolvedModel,
                String fallbackModelUsed,
                boolean fallbackOccurred,
                String finishReason,
                long latencyMs,
                int errorOrRetryCount,
                Long promptTokens,
                Long completionTokens,
                Long totalTokens,
                String rawHttpResponse,
                String rawHttpResponseBase64,
                String error) {
            this.provider = provider;
            this.requestedModel = requestedModel;
            this.actualResolvedModel = actualResolvedModel;
            this.fallbackModelUsed = fallbackModelUsed;
            this.fallbackOccurred = fallbackOccurred;
            this.finishReason = finishReason;
            this.latencyMs = latencyMs;
            this.errorOrRetryCount = errorOrRetryCount;
            this.promptTokens = promptTokens;
            this.completionTokens = completionTokens;
            this.totalTokens = totalTokens;
            this.rawHttpResponse = rawHttpResponse;
            this.rawHttpResponseBase64 = rawHttpResponseBase64;
            this.error = error;
        }

        String provider() { return provider; }
        String requestedModel() { return requestedModel; }
        String actualResolvedModel() { return actualResolvedModel; }
        String fallbackModelUsed() { return fallbackModelUsed; }
        boolean fallbackOccurred() { return fallbackOccurred; }
        String finishReason() { return finishReason; }
        long latencyMs() { return latencyMs; }
        int errorOrRetryCount() { return errorOrRetryCount; }
        Long promptTokens() { return promptTokens; }
        Long completionTokens() { return completionTokens; }
        Long totalTokens() { return totalTokens; }
        String rawHttpResponse() { return rawHttpResponse; }
        String rawHttpResponseBase64() { return rawHttpResponseBase64; }
        String error() { return error; }
    }

    private record ParsedChatResponse(
            String text,
            String actualResolvedModel,
            String finishReason,
            Long promptTokens,
            Long completionTokens,
            Long totalTokens,
            String rawHttpResponse,
            String rawHttpResponseBase64) {
    }

    private static final class ObservedChatException extends RuntimeException {
        private final String rawHttpResponse;
        private final String rawHttpResponseBase64;

        ObservedChatException(String message, String rawHttpResponse, String rawHttpResponseBase64, Throwable cause) {
            super(message, cause);
            this.rawHttpResponse = rawHttpResponse;
            this.rawHttpResponseBase64 = rawHttpResponseBase64;
        }
    }

    ChatObservation getLastChatObservation() {
        return lastChatObservation.get();
    }

    void setBenchmarkObservationEnabled(boolean enabled) {
        if (enabled) {
            benchmarkObservationEnabled.set(true);
        } else {
            benchmarkObservationEnabled.remove();
            lastChatObservation.remove();
        }
    }

    private void observe(ChatObservation observation) {
        if (Boolean.TRUE.equals(benchmarkObservationEnabled.get())) {
            lastChatObservation.set(observation);
        }
    }

    public OpenRouterProvider(AiConfigProperties config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;

        AiConfigProperties.OpenRouterConfig cfg = config.getOpenrouter();

        this.keyManager = new OpenRouterKeyManager(cfg.getApiKeysArray());
        this.referer = cfg.getReferer() != null ? cfg.getReferer() : "http://localhost:8081";
        this.appTitle = cfg.getAppTitle() != null ? cfg.getAppTitle() : "MIDORI AI Sensei";

        this.chatTimeoutMs = cfg.getChatTimeoutMs() > 0 ? cfg.getChatTimeoutMs() : DEFAULT_CHAT_TIMEOUT_MS;
        this.quizTimeoutMs = cfg.getQuizTimeoutMs() > 0 ? cfg.getQuizTimeoutMs() : DEFAULT_QUIZ_TIMEOUT_MS;
        this.chatMaxTokens = cfg.getChatMaxTokens() > 0 ? cfg.getChatMaxTokens() : DEFAULT_CHAT_MAX_TOKENS;
        this.quizMaxTokens = cfg.getQuizMaxTokens() > 0 ? cfg.getQuizMaxTokens() : DEFAULT_QUIZ_MAX_TOKENS;

        List<String> primary = sanitizeModels(parseModelList(cfg.getModels()));
        List<String> fallbacks = sanitizeModels(cfg.getFallbackModelsList());

        if (primary.isEmpty()) {
            log.warn("[OpenRouterProvider] No OpenRouter model configured. Set OPENROUTER_MODEL env var.");
            primary.add("openrouter/free");
        }

        this.chatModels = buildCappedChain(primary, fallbacks, 4);
        this.quizModels = buildCappedChain(primary, fallbacks, 4);

        int totalKeys = keyManager.getTotalKeyCount();
        int activeKeys = keyManager.getRemainingKeyCount();
        log.info("[OpenRouterProvider] Initialized — keys: {}/{} active, chat-chain: {}, quiz-chain: {}",
                activeKeys, totalKeys, this.chatModels, this.quizModels);
        log.info("[OpenRouterProvider] Token configuration - chatMaxTokens: {}, quizMaxTokens: {}", chatMaxTokens, quizMaxTokens);
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.OPENROUTER;
    }

    @Override
    public String getName() {
        int total = keyManager.getTotalKeyCount();
        int remaining = keyManager.getRemainingKeyCount();
        String model = chatModels.isEmpty() ? "unknown" : chatModels.get(0);
        return String.format("OpenRouter %s [%d/%d keys active]", model, remaining, total);
    }

    @Override
    public boolean isConfigured() {
        return config.getOpenrouter().isConfigured();
    }

    @Override
    public List<String> getModels() {
        return chatModels;
    }

    @Override
    public String getLastModelUsed() {
        return lastModelUsed;
    }

    @Override
    public String getLastFinishReason() {
        return lastFinishReason.get();
    }

    @Override
    public Integer getLastPromptTokens() {
        return lastPromptTokens.get();
    }

    @Override
    public Integer getLastCompletionTokens() {
        return lastCompletionTokens.get();
    }

    @Override
    public Integer getLastTotalTokens() {
        return lastTotalTokens.get();
    }

    @Override
    public void clearMetrics() {
        lastFinishReason.remove();
        lastPromptTokens.remove();
        lastCompletionTokens.remove();
        lastTotalTokens.remove();
    }

    // ============================================================
    // Chat Implementation
    // ============================================================

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory) {
        return chat(systemPrompt, userMessage, conversationHistory, null);
    }

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory, AiTaskType taskType) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenRouter API key is not configured. Set OPENROUTER_API_KEYS env var.");
        }

        lastChatObservation.remove();
        String requestedModel = chatModels.isEmpty() ? null : chatModels.get(0);
        long overallStart = System.currentTimeMillis();
        Throwable lastError = null;
        String lastRawHttpResponse = null;
        String lastRawHttpResponseBase64 = null;

        for (int modelIdx = 0; modelIdx < chatModels.size(); modelIdx++) {
            String model = chatModels.get(modelIdx);
            int modelAttempt = modelIdx + 1;

            int keyAttempt = 0;
            while (keyAttempt < keyManager.getRemainingKeyCount()) {
                String apiKey = keyManager.getCurrentKey();
                int currentKeyIdx = keyManager.getCurrentKeyIndex();
                int activeKeys = keyManager.getRemainingKeyCount();
                String masked = OpenRouterKeyManager.mask(apiKey);
                long start = System.currentTimeMillis();

                try {
                    ParsedChatResponse response = callChatObservedWithTaskType(
                            model, apiKey, systemPrompt, userMessage, conversationHistory,
                            chatMaxTokens, DEFAULT_STUDY_TEMPERATURE, createFactory(chatTimeoutMs), taskType);
                    long duration = System.currentTimeMillis() - start;
                    log.info("[OpenRouter] model={} key={}/{} durationMs={} status=OK",
                            model, currentKeyIdx + 1, activeKeys, duration);
                    lastModelUsed = model;
                    observe(new ChatObservation(
                            "OPENROUTER", requestedModel, response.actualResolvedModel(),
                            (keyAttempt > 0 || modelAttempt > 1) ? model : null,
                            keyAttempt > 0 || modelAttempt > 1,
                            response.finishReason(),
                            System.currentTimeMillis() - overallStart,
                            keyAttempt,
                            response.promptTokens(), response.completionTokens(), response.totalTokens(),
                            response.rawHttpResponse(), response.rawHttpResponseBase64(), null));
                    return response.text();

                } catch (AuthException e) {
                    long duration = System.currentTimeMillis() - start;
                    log.warn("[OpenRouter] model={} key={} status=AUTH — excluding key",
                            model, masked);
                    keyManager.excludeKey(apiKey);
                    lastError = e;
                    if (keyManager.getRemainingKeyCount() == 0) break;
                    keyAttempt++;
                    continue;

                } catch (RetryableException e) {
                    long duration = System.currentTimeMillis() - start;
                    log.warn("[OpenRouter] model={} key={} durationMs={} status=RETRY — rotating key: {}",
                            model, masked, duration, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;

                } catch (NonRetryableException e) {
                    long duration = System.currentTimeMillis() - start;
                    log.warn("[OpenRouter] model={} key={} status=NON_RETRYABLE — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break; // break key loop, try next model

                } catch (ObservedChatException e) {
                    long duration = System.currentTimeMillis() - start;
                    lastRawHttpResponse = e.rawHttpResponse;
                    lastRawHttpResponseBase64 = e.rawHttpResponseBase64;
                    log.warn("[OpenRouter] model={} key={} durationMs={} status=RETRY: {}",
                            model, masked, duration, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;

                } catch (RuntimeException e) {
                    long duration = System.currentTimeMillis() - start;
                    log.warn("[OpenRouter] model={} key={} durationMs={} status=RETRY: {}",
                            model, masked, duration, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;

                } catch (Exception e) {
                    long duration = System.currentTimeMillis() - start;
                    log.warn("[OpenRouter] model={} key={} durationMs={} status=UNEXPECTED: {}",
                            model, masked, duration, e.getMessage());
                    lastError = e;
                    break;
                }
            }
        }

        log.error("[OpenRouter] All models and keys exhausted. lastError={}", lastError != null ? lastError.getMessage() : "null");
        recordFailedObservation(requestedModel, null, chatModels.size(), 0, overallStart,
                lastError, lastRawHttpResponse, lastRawHttpResponseBase64);
        String msg = lastError != null ? lastError.getMessage() : "Không rõ";
        if (msg.contains("429") || msg.toLowerCase().contains("rate") || msg.toLowerCase().contains("timeout")) {
            throw new TemporaryFailureException("AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        }
        throw new RuntimeException("AI không phản hồi được. Vui lòng thử lại sau.");
    }

    private void recordFailedObservation(
            String requestedModel,
            String attemptedModel,
            int attempt,
            int retryCount,
            long overallStart,
            Throwable error,
            String rawHttpResponse,
            String rawHttpResponseBase64) {
        boolean fallbackOccurred = attemptedModel != null
                ? attempt > 0
                : chatModels.size() > 1;
        String fallbackModelUsed = fallbackOccurred ? attemptedModel : null;
        observe(new ChatObservation(
                "OPENROUTER",
                requestedModel,
                null,
                fallbackModelUsed,
                fallbackOccurred,
                null,
                System.currentTimeMillis() - overallStart,
                retryCount,
                null,
                null,
                null,
                rawHttpResponse,
                rawHttpResponseBase64,
                error == null ? "Unknown provider failure" : error.getClass().getSimpleName() + ": " + error.getMessage()));
    }

    // ============================================================
    // Question Generation Implementation
    // ============================================================

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty) {
        return generateQuestions(materialTitle, materialContent, questionCount, questionType, difficulty, null, null);
    }

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty,
                                   java.util.List<String> selectedSkills, com.midori.ai.AiTaskType taskType) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenRouter API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                materialTitle, materialContent, questionCount, questionType, difficulty, selectedSkills);

        Throwable lastError = null;
        for (int modelIdx = 0; modelIdx < quizModels.size(); modelIdx++) {
            String model = quizModels.get(modelIdx);
            int keyAttempt = 0;
            while (keyAttempt < keyManager.getRemainingKeyCount()) {
                String apiKey = keyManager.getCurrentKey();
                String masked = OpenRouterKeyManager.mask(apiKey);
                int currentKeyIdx = keyManager.getCurrentKeyIndex();
                int activeKeys = keyManager.getRemainingKeyCount();
                long start = System.currentTimeMillis();
                try {
                    String response = callGenerateQuestions(model, apiKey, prompt, quizMaxTokens, DEFAULT_QUIZ_TEMPERATURE,
                            createFactory(quizTimeoutMs));
                    String cleaned = cleanJsonResponse(response);
                    lastModelUsed = model;
                    log.info("[OpenRouter] model={} key={}/{} kind=quiz status=OK", model, currentKeyIdx + 1, activeKeys);
                    return cleaned;
                } catch (AuthException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=AUTH — excluding key: {}",
                            model, masked, e.getMessage());
                    keyManager.excludeKey(apiKey);
                    lastError = e;
                    if (keyManager.getRemainingKeyCount() == 0) break;
                    keyAttempt++;
                    continue;
                } catch (RetryableException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=RETRY — rotating key: {}",
                            model, masked, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (InvalidJsonException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=INVALID_JSON — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                } catch (NonRetryableException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=NON_RETRYABLE — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                } catch (RuntimeException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=RETRY — rotating key: {}",
                            model, masked, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (Exception e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz status=UNEXPECTED — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                }
            }
        }

        log.error("[OpenRouter] All quiz models and keys exhausted. lastError={}", lastError != null ? lastError.getMessage() : "null");
        String msg = lastError != null ? lastError.getMessage() : "Không rõ";
        if (msg.contains("429") || msg.toLowerCase().contains("rate") || msg.toLowerCase().contains("timeout")) {
            throw new TemporaryFailureException("AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        }
        if (msg.toLowerCase().contains("invalid") || msg.toLowerCase().contains("json")) {
            throw new RuntimeException("AI trả dữ liệu không hợp lệ. Đang dùng quiz local.");
        }
        throw new RuntimeException("AI không phản hồi được. Vui lòng thử lại sau.");
    }

    @Override
    public String generateQuestionsWithDistribution(String materialTitle, String materialContent,
                                                     int distributionTotal, String questionType,
                                                     String distributionLine,
                                                     java.util.List<String> selectedSkills,
                                                     com.midori.ai.AiTaskType taskType) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenRouter API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildQuizGenerationPromptWithDistribution(
                materialTitle, materialContent, distributionTotal, questionType, distributionLine, selectedSkills);

        Throwable lastError = null;
        for (int modelIdx = 0; modelIdx < quizModels.size(); modelIdx++) {
            String model = quizModels.get(modelIdx);
            int keyAttempt = 0;
            while (keyAttempt < keyManager.getRemainingKeyCount()) {
                String apiKey = keyManager.getCurrentKey();
                String masked = OpenRouterKeyManager.mask(apiKey);
                int currentKeyIdx = keyManager.getCurrentKeyIndex();
                int activeKeys = keyManager.getRemainingKeyCount();
                long start = System.currentTimeMillis();
                try {
                    String response = callGenerateQuestions(model, apiKey, prompt, quizMaxTokens, DEFAULT_QUIZ_TEMPERATURE,
                            createFactory(quizTimeoutMs));
                    String cleaned = cleanJsonResponse(response);
                    lastModelUsed = model;
                    log.info("[OpenRouter] model={} key={}/{} kind=quiz-dist status=OK", model, currentKeyIdx + 1, activeKeys);
                    return cleaned;
                } catch (AuthException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=AUTH — excluding key: {}",
                            model, masked, e.getMessage());
                    keyManager.excludeKey(apiKey);
                    lastError = e;
                    if (keyManager.getRemainingKeyCount() == 0) break;
                    keyAttempt++;
                    continue;
                } catch (RetryableException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=RETRY — rotating key: {}",
                            model, masked, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (InvalidJsonException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=INVALID_JSON — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                } catch (NonRetryableException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=NON_RETRYABLE — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                } catch (RuntimeException e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=RETRY — rotating key: {}",
                            model, masked, e.getMessage());
                    String next = keyManager.getNextKey();
                    lastError = e;
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (Exception e) {
                    log.warn("[OpenRouter] model={} key={} kind=quiz-dist status=UNEXPECTED — trying next model: {}",
                            model, masked, e.getMessage());
                    lastError = e;
                    break;
                }
            }
        }

        log.error("[OpenRouter] All quiz-dist models and keys exhausted. lastError={}", lastError != null ? lastError.getMessage() : "null");
        String msg = lastError != null ? lastError.getMessage() : "Không rõ";
        if (msg.contains("429") || msg.toLowerCase().contains("rate") || msg.toLowerCase().contains("timeout")) {
            throw new TemporaryFailureException("AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        }
        if (msg.toLowerCase().contains("invalid") || msg.toLowerCase().contains("json")) {
            throw new RuntimeException("AI trả dữ liệu không hợp lệ. Đang dùng quiz local.");
        }
        throw new RuntimeException("AI không phản hồi được. Vui lòng thử lại sau.");
    }

    // ============================================================
    // Exam Parsing Implementation (OpenRouter can do this)
    // ============================================================

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        if (!isConfigured()) {
            throw new AiParsingException("OpenRouter API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildExamParsingPrompt(extractedText, filename);

        // Use chat models for exam parsing with key rotation
        for (int modelIdx = 0; modelIdx < chatModels.size(); modelIdx++) {
            String model = chatModels.get(modelIdx);
            int keyAttempt = 0;
            while (keyAttempt < keyManager.getRemainingKeyCount()) {
                String apiKey = keyManager.getCurrentKey();
                int currentKeyIdx = keyManager.getCurrentKeyIndex();
                int activeKeys = keyManager.getRemainingKeyCount();
                long startMs = System.currentTimeMillis();
                try {
                    String response = callChat(model, apiKey, null, prompt, null, chatMaxTokens, DEFAULT_QUIZ_TEMPERATURE,
                            createFactory(quizTimeoutMs));
                    long latencyMs = System.currentTimeMillis() - startMs;
                    log.info("[OpenRouter] model={} key={}/{} kind=exam status=OK ({}ms)", model, currentKeyIdx + 1, activeKeys, latencyMs);
                    lastModelUsed = model;
                    String cleaned = cleanJsonResponse(response);
                    return parseExamJson(cleaned);
                } catch (AuthException e) {
                    log.warn("[OpenRouter] model={} kind=exam status=AUTH — excluding key: {}", model, e.getMessage());
                    keyManager.excludeKey(apiKey);
                    if (keyManager.getRemainingKeyCount() == 0) break;
                    keyAttempt++;
                    continue;
                } catch (RetryableException | ObservedChatException e) {
                    log.warn("[OpenRouter] model={} kind=exam status=RETRY — rotating key: {}", model, e.getMessage());
                    String next = keyManager.getNextKey();
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (RuntimeException e) {
                    log.warn("[OpenRouter] model={} kind=exam status=RETRY — rotating key: {}", model, e.getMessage());
                    String next = keyManager.getNextKey();
                    if (next == null) break;
                    keyAttempt++;
                    continue;
                } catch (Exception e) {
                    log.warn("[OpenRouter] model={} kind=exam status=UNEXPECTED — trying next model: {}", model, e.getMessage());
                    break;
                }
            }
        }

        throw new AiParsingException("OpenRouter failed to parse exam. All models and keys exhausted.");
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private SimpleClientHttpRequestFactory createFactory(int readTimeoutMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofMillis(DEFAULT_CONNECT_TIMEOUT_MS));
        f.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return f;
    }

    private List<String> sanitizeModels(List<String> input) {
        List<String> out = new ArrayList<>();
        if (input == null) return out;
        for (String m : input) {
            if (m == null) continue;
            String trimmed = m.trim();
            if (trimmed.isEmpty()) continue;
            if (KNOWN_BAD_MODELS.contains(trimmed)) {
                log.info("[OpenRouterProvider] Skipping known-bad model: {}", trimmed);
                continue;
            }
            out.add(trimmed);
        }
        return out;
    }

    private List<String> parseModelList(String modelsConfig) {
        List<String> result = new ArrayList<>();
        if (modelsConfig != null && !modelsConfig.isBlank()) {
            for (String m : modelsConfig.split(",")) {
                String trimmed = m.trim();
                if (!trimmed.isEmpty()) result.add(trimmed);
            }
        }
        return result;
    }

    private List<String> buildCappedChain(List<String> primary, List<String> fallbacks, int maxSize) {
        List<String> chain = new ArrayList<>();
        for (String m : primary) {
            if (chain.size() >= maxSize) break;
            if (!chain.contains(m)) chain.add(m);
        }
        for (String m : fallbacks) {
            if (chain.size() >= maxSize) break;
            if (!chain.contains(m)) chain.add(m);
        }
        return chain;
    }

    private String callChat(String model, String apiKey, String systemPrompt, String userMessage,
                            List<String[]> conversationHistory,
                            int maxTokens, double temperature,
                            SimpleClientHttpRequestFactory factory) {
        return callChatObserved(model, apiKey, systemPrompt, userMessage, conversationHistory,
                maxTokens, temperature, factory).text();
    }

    private ParsedChatResponse callChatObserved(
            String model,
            String apiKey,
            String systemPrompt,
            String userMessage,
            List<String[]> conversationHistory,
            int maxTokens,
            double temperature,
            SimpleClientHttpRequestFactory factory) {
        return callChatObservedWithTaskType(model, apiKey, systemPrompt, userMessage, conversationHistory,
                maxTokens, temperature, factory, null);
    }

    private ParsedChatResponse callChatObservedWithTaskType(
            String model,
            String apiKey,
            String systemPrompt,
            String userMessage,
            List<String[]> conversationHistory,
            int maxTokens,
            double temperature,
            SimpleClientHttpRequestFactory factory,
            AiTaskType taskType) {
        // Bump maxTokens for ADMIN_CONTENT_LIBRARY_GENERATION (vocabulary/grammar/reading generation with PDFs).
        int effectiveMaxTokens = maxTokens;
        if (taskType == AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION) {
            effectiveMaxTokens = Math.max(maxTokens, 8192);
        }

        List<Map<String, Object>> messages = new ArrayList<>();

        if (systemPrompt != null) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        if (conversationHistory != null) {
            for (String[] msg : conversationHistory) {
                String role = msg[0];
                String content = msg[1];
                String mappedRole = "USER".equalsIgnoreCase(role) ? "user" : "assistant";
                messages.add(Map.of("role", mappedRole, "content", content));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", effectiveMaxTokens);
        requestBody.put("temperature", temperature);
        requestBody.put("top_p", 0.8);
        requestBody.put("frequency_penalty", 0.3);

        if (taskType == AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("HTTP-Referer", referer);
        headers.set("X-Title", appTitle);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        RestTemplate rt = new RestTemplate(factory);
        try {
            ResponseEntity<byte[]> response = rt.postForEntity(OPENROUTER_API_URL, request, byte[].class);
            byte[] rawBytes = response.getBody();
            String rawBase64 = rawBytes == null ? null : Base64.getEncoder().encodeToString(rawBytes);
            String rawText;
            try {
                rawText = decodeUtf8Strict(rawBytes);
            } catch (CharacterCodingException e) {
                throw new ObservedChatException(
                        "Malformed UTF-8 in OpenRouter HTTP response for model " + model,
                        null,
                        rawBase64,
                        e);
            }
            try {
                return extractChatResponse(rawText, rawBase64, model);
            } catch (RetryableException e) {
                throw new ObservedChatException(e.getMessage(), rawText, rawBase64, e);
            }
        } catch (HttpClientErrorException e) {
            handleHttpError(e, model);
            throw new RetryableException("HTTP error: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new RetryableException("timeout");
        }
    }

    private static String decodeUtf8Strict(byte[] rawBytes) throws CharacterCodingException {
        if (rawBytes == null) return null;
        return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(rawBytes))
                .toString();
    }

    private String callGenerateQuestions(String model, String apiKey, String prompt,
                                        int maxTokens, double temperature,
                                        SimpleClientHttpRequestFactory factory) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("HTTP-Referer", referer);
        headers.set("X-Title", appTitle);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        RestTemplate rt = new RestTemplate(factory);
        try {
            // Read the response as raw bytes so we can decode it as UTF-8 ourselves.
            // OpenRouter's Content-Type is `application/json` with no `charset=utf-8`,
            // so Spring's default StringHttpMessageConverter falls back to ISO-8859-1
            // and silently mangles Japanese / Vietnamese into mojibake ("T? có ngh?a là gì?"
            // instead of "Từ có nghĩa là gì?", "???" instead of "こんにちは").
            // Using byte[] + StandardCharsets.UTF_8 makes the decoding explicit and
            // matches the safe approach already used by callChat above.
            ResponseEntity<byte[]> response = rt.postForEntity(OPENROUTER_API_URL, request, byte[].class);
            byte[] rawBytes = response.getBody();
            String rawText;
            try {
                rawText = decodeUtf8Strict(rawBytes);
            } catch (CharacterCodingException e) {
                throw new RetryableException("Malformed UTF-8 in OpenRouter HTTP response for model " + model);
            }
            return extractTextFromResponse(rawText, model);
        } catch (HttpClientErrorException e) {
            handleHttpError(e, model);
            throw new RetryableException("HTTP error: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new RetryableException("timeout");
        }
    }

    private void handleHttpError(HttpClientErrorException e, String model) {
        int code = e.getStatusCode().value();
        if (code == 401 || code == 403) {
            throw new AuthException("API key không hợp lệ hoặc bị từ chối (HTTP " + code + ").");
        }
        if (code == 404) {
            throw new NonRetryableException("Model " + model + " không tồn tại (HTTP 404).");
        }
        if (code == 429 || code == 502 || code == 503 || code == 504) {
            throw new RetryableException("HTTP " + code);
        }
        if (code == 400) {
            String body = e.getResponseBodyAsString();
            if (body != null && body.contains("context_length")) {
                throw new RetryableException("Context too long (HTTP 400)");
            }
            throw new NonRetryableException("Yêu cầu không hợp lệ (HTTP 400).");
        }
        throw new RetryableException("HTTP " + code);
    }

    private String extractTextFromResponse(String response, String model) {
        try {
            if (response == null || response.isEmpty()) {
                throw new RetryableException("Empty response from model " + model);
            }
            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).path("message");
                String text = message.path("content").asText();
                if (text != null && !text.isEmpty()) {
                    return text;
                }
            }
            JsonNode error = root.path("error");
            if (error.has("message")) {
                String errorMsg = error.path("message").asText();
                log.error("[OpenRouterProvider] OpenRouter error: {}", errorMsg);
                if (errorMsg.toLowerCase().contains("unauthorized") || errorMsg.toLowerCase().contains("invalid api key")) {
                    throw new AuthException("API key không hợp lệ: " + errorMsg);
                }
                if (errorMsg.toLowerCase().contains("not found") || errorMsg.toLowerCase().contains("model")) {
                    throw new NonRetryableException("Model không hợp lệ: " + errorMsg);
                }
                throw new RetryableException("OpenRouter error: " + errorMsg);
            }
            throw new RetryableException("Invalid response format from model " + model);
        } catch (AuthException | RetryableException | NonRetryableException e) {
            throw e;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RetryableException("Failed to parse response: " + e.getMessage());
        }
    }

    private ParsedChatResponse extractChatResponse(String response, String rawBase64, String model) {
        try {
            if (response == null || response.isEmpty()) {
                throw new RetryableException("Empty response from model " + model);
            }
            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode choice = choices.get(0);
                JsonNode message = choice.path("message");
                String text = message.path("content").asText();
                if (text != null && !text.isEmpty()) {
                    JsonNode usage = root.path("usage");
                    
                    lastFinishReason.set(textOrNull(choice.path("finish_reason")));
                    if (usage != null && !usage.isMissingNode() && !usage.isNull()) {
                        Long pt = longOrNull(usage.path("prompt_tokens"));
                        Long ct = longOrNull(usage.path("completion_tokens"));
                        Long tt = longOrNull(usage.path("total_tokens"));
                        lastPromptTokens.set(pt != null ? pt.intValue() : null);
                        lastCompletionTokens.set(ct != null ? ct.intValue() : null);
                        lastTotalTokens.set(tt != null ? tt.intValue() : null);
                    }
                    
                    return new ParsedChatResponse(
                            text,
                            textOrNull(root.path("model")),
                            textOrNull(choice.path("finish_reason")),
                            longOrNull(usage.path("prompt_tokens")),
                            longOrNull(usage.path("completion_tokens")),
                            longOrNull(usage.path("total_tokens")),
                            response,
                            rawBase64);
                }
            }
            JsonNode error = root.path("error");
            if (error.has("message")) {
                String errorMsg = error.path("message").asText();
                log.error("[OpenRouterProvider] OpenRouter error: {}", errorMsg);
                if (errorMsg.toLowerCase().contains("unauthorized") || errorMsg.toLowerCase().contains("invalid api key")) {
                    throw new AuthException("API key không hợp lệ: " + errorMsg);
                }
                if (errorMsg.toLowerCase().contains("not found") || errorMsg.toLowerCase().contains("model")) {
                    throw new NonRetryableException("Model không hợp lệ: " + errorMsg);
                }
                throw new RetryableException("OpenRouter error: " + errorMsg);
            }
            throw new RetryableException("Invalid response format from model " + model);
        } catch (AuthException | RetryableException | NonRetryableException e) {
            throw e;
        } catch (Exception e) {
            throw new ObservedChatException(
                    "Failed to parse response: " + e.getMessage(),
                    response,
                    rawBase64,
                    e);
        }
    }

    private static String textOrNull(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    private static Long longOrNull(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() || !node.canConvertToLong()
                ? null
                : node.asLong();
    }

    public String cleanJsonResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidJsonException("Empty response");
        }

        String cleaned = raw.trim();

        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }

        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        cleaned = cleaned.trim();

        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return cleaned.trim();
    }

    private AiExamParseResponse parseExamJson(String json) throws AiParsingException {
        try {
            return objectMapper.readValue(json, AiExamParseResponse.class);
        } catch (Exception e) {
            throw new AiParsingException("Failed to parse exam JSON: " + e.getMessage());
        }
    }

    // Custom exceptions
    private static class AuthException extends RuntimeException {
        AuthException(String msg) { super(msg); }
    }
    private static class RetryableException extends RuntimeException {
        RetryableException(String msg) { super(msg); }
    }
    private static class NonRetryableException extends RuntimeException {
        NonRetryableException(String msg) { super(msg); }
    }
    /**
     * Signifies that all models/keys within OpenRouter are temporarily unavailable
     * (rate limits, timeouts, 429s). AiCoreService.classifyFailure() checks this
     * type to allow cross-provider fallback without relying on message-string parsing.
     */
    public static class TemporaryFailureException extends RuntimeException {
        public TemporaryFailureException(String msg) { super(msg); }
    }
    private static class InvalidJsonException extends RuntimeException {
        InvalidJsonException(String msg) { super(msg); }
    }
}

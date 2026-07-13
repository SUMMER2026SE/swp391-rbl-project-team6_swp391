package com.midori.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.AiParsingException;
import com.midori.ai.key.GeminiKeyManager;
import com.midori.ai.model.GeminiModelResolver;
import com.midori.ai.model.ModelResolutionResult;
import com.midori.ai.model.ModelSelectionContext;
import com.midori.ai.prompt.AiPromptBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Functional interface for API calls that can be retried across multiple keys.
 * Each method in GeminiProvider passes its webclient call as a lambda here,
 * and executeWithKeyRetry() handles the retry loop, rotation, and logging.
 */
@FunctionalInterface
interface RetryableCall<T> {
    /**
     * Execute the API call with the currently active key.
     * @param apiKey the key to use for this attempt
     * @return the parsed response
     */
    T execute(String apiKey) throws Exception;
}

@FunctionalInterface
interface FallbackAction<T> {
    T execute(String model, String apiKey) throws Exception;
}

@Slf4j
@Component
public class GeminiProvider implements AiProvider {

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;
    private final GeminiKeyManager keyManager;
    private final GeminiModelResolver modelResolver;
    private volatile String lastModelUsed;

    // Global request counter for monitoring
    private static final AtomicInteger globalRequestCounter = new AtomicInteger(0);
    // Per-pipeline request counter (set via ThreadLocal of AtomicInteger for mutability)
    private static final ThreadLocal<AtomicInteger> pipelineRequestCounter = ThreadLocal.withInitial(AtomicInteger::new);

    public GeminiProvider(AiConfigProperties config, ObjectMapper objectMapper, WebClient.Builder webClientBuilder, GeminiModelResolver modelResolver) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
        this.keyManager = new GeminiKeyManager(config.getGemini().getApiKeysStr());
        this.modelResolver = modelResolver;

        log.info("==============================================");
        log.info("[GeminiProvider] INITIALIZED");
        log.info("==============================================");
        log.info("  Model: {}", config.getGemini().getModel());
        log.info("  Base URL: {}", config.getGemini().getBaseUrl());
        log.info("  API Keys configured: {}", keyManager.getKeyCount());
        log.info("  API Key 1 loaded: {}", config.getGemini().getPrimaryApiKey() != null ? "YES" : "NO");
        log.info("  Timeout: {}s", config.getTimeoutSeconds());
        log.info("  Temperature: {}", config.getTemperature());
        log.info("  Max Tokens: {}", config.getMaxTokens());
        log.info("==============================================");

        if (config.getGemini().getApiKeysStr() != null && !config.getGemini().getApiKeysStr().isBlank()) {
            String[] keys = config.getGemini().getApiKeysStr().split(",");
            for (int i = 0; i < keys.length; i++) {
                String maskedKey = keys[i].trim().substring(0, 4) + "..." + keys[i].trim().substring(keys[i].trim().length() - 4);
                log.info("  Key {}: {} (last 6: {})", i + 1, maskedKey, keys[i].trim().substring(keys[i].trim().length() - 6));
            }
        }
    }

    // ============================================================
    // Request Counter Methods
    // ============================================================

    /**
     * Reset the pipeline request counter for a new video processing.
     * Call this at the start of each video processing pipeline.
     */
    public void resetPipelineCounter() {
        pipelineRequestCounter.get().set(0);
        log.info("[GeminiProvider] Pipeline counter RESET for new video");
    }

    /**
     * Increment and get the current pipeline request count.
     */
    private int incrementAndGetPipelineCount() {
        return pipelineRequestCounter.get().incrementAndGet();
    }

    /**
     * Get the current pipeline request count without incrementing.
     */
    public int getPipelineRequestCount() {
        return pipelineRequestCounter.get().get();
    }

    /**
     * Get the global total request count across all pipelines.
     */
    public int getGlobalRequestCount() {
        return globalRequestCounter.get();
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.GEMINI;
    }

    @Override
    public String getName() {
        String model = config.getGemini().getModel();
        return "Google Gemini " + (model != null ? model : "dynamic");
    }

    @Override
    public boolean isConfigured() {
        return config.getGemini().isConfigured();
    }

    @Override
    public List<String> getModels() {
        return modelResolver.getConfiguredModels();
    }

    @Override
    public String getLastModelUsed() {
        return lastModelUsed;
    }

    // ============================================================
    // Shared Retry Helper
    // ============================================================

    /**
     * Execute a Gemini API call with automatic multi-key retry on 429.
     *
     * On HTTP 429: rotates to the next key and retries up to keyManager.getKeyCount() times.
     * On other HTTP errors or exceptions: throws immediately.
     *
     * @param operationLabel human-readable label for log messages (e.g. "translation", "chat")
     * @param call           the API call lambda; receives the current key, returns the parsed result
     * @return the result from the successful call
     * @throws RuntimeException on all errors after exhausting all keys
     */
    private <T> T executeWithKeyRetry(String operationLabel, RetryableCall<T> call) {
        int maxRetries = Math.max(1, keyManager.getKeyCount());
        RuntimeException lastError = null;

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            String apiKey = keyManager.getCurrentKey();
            log.info("[GeminiProvider] Using Gemini key {}/{} for {}", attempt + 1, maxRetries, operationLabel);

            try {
                T result = call.execute(apiKey);
                log.info("[GeminiProvider] {} succeeded with key {}/{}", operationLabel, attempt + 1, maxRetries);
                return result;

            } catch (WebClientResponseException e) {
                int status = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.error("[GeminiProvider] HTTP ERROR - Status: {}, Response: {}", status, responseBody);
                if ((status == 429 || status == 401 || status == 403) && attempt < maxRetries - 1) {
                    log.warn("[GeminiProvider] HTTP {} received on {} with key {}/{} — rotating to next key", status, operationLabel, attempt + 1, maxRetries);
                    keyManager.markKeyFailedAndGetNext();
                    continue;
                }
                lastError = new RuntimeException("Gemini API error (" + status + "): " + responseBody, e);

            } catch (Exception e) {
                if (attempt < maxRetries - 1) {
                    log.warn("[GeminiProvider] {} failed with key {}/{}: {} — trying next key", operationLabel, attempt + 1, maxRetries, e.getMessage());
                    keyManager.markKeyFailedAndGetNext();
                    continue;
                }
                lastError = new RuntimeException("Gemini " + operationLabel + " failed: " + e.getMessage(), e);
            }
        }

        log.error("[GeminiProvider] All {} Gemini key(s) exhausted for {}", maxRetries, operationLabel);
        throw lastError != null ? lastError : new RuntimeException("All Gemini API keys exhausted for " + operationLabel);
    }

    private void validateConfig() {
        String[] apiKeys = config.getGemini().getApiKeys();
        if (apiKeys == null || apiKeys.length == 0) {
            throw new IllegalStateException("GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY or ai.gemini.api-keys.");
        }
    }

    private List<String> resolveModelsForTask(AiTaskType taskType, String operation) {
        ModelSelectionContext context = ModelSelectionContext.of(
                taskType != null ? taskType : AiTaskType.DEFAULT,
                "GeminiProvider",
                operation != null ? operation : "operation"
        );
        ModelResolutionResult result = modelResolver.resolve(context);
        log.info("[GeminiProvider] Model selection for task={}: selected={}, reason={}", result.taskType(), result.selectedModel(), result.reason());
        return List.of(result.selectedModel());
    }

    private boolean isFallbackStatusCode(int status) {
        return status == 400 || status == 404 || status == 429 || status == 500 || status == 503;
    }

    private <T> T executeWithFallback(String operationLabel, FallbackAction<T> action, AiTaskType taskType) {
        validateConfig();
        List<String> models = resolveModelsForTask(taskType, operationLabel);
        List<ModelFailure> failures = new ArrayList<>();

        for (int i = 0; i < models.size(); i++) {
            String model = models.get(i);
            log.info("[GeminiProvider] [FALLBACK-LOOP] Attempting {} with model {} (attempt {}/{})",
                    operationLabel, model, i + 1, models.size());

            try {
                T result = executeWithKeyRetry(operationLabel, (apiKey) -> {
                    return action.execute(model, apiKey);
                });

                lastModelUsed = model;
                log.info("[GeminiProvider] [FALLBACK-LOOP] {} succeeded with model {}", operationLabel, model);
                return result;

            } catch (Exception e) {
                Integer status = null;
                String body = null;
                String msg = e.getMessage();

                Throwable cause = e;
                while (cause != null && !(cause instanceof WebClientResponseException)) {
                    cause = cause.getCause();
                }

                if (cause instanceof WebClientResponseException wcre) {
                    status = wcre.getStatusCode().value();
                    body = wcre.getResponseBodyAsString();
                }

                log.warn("[GeminiProvider] [FALLBACK-LOOP] {} failed with model {}. Status: {}, Error: {}",
                        operationLabel, model, status != null ? status : "N/A", msg);

                failures.add(new ModelFailure(model, status, body, msg));

                if (i == models.size() - 1) {
                    break;
                }

                if (status != null && !isFallbackStatusCode(status)) {
                    log.warn("[GeminiProvider] [FALLBACK-LOOP] Status {} does not warrant fallback. Aborting fallback loop.", status);
                    break;
                }
            }
        }

        throw new GeminiFallbackException("All Gemini models failed for " + operationLabel, failures);
    }

    // ============================================================
    // Chat Implementation
    // ============================================================

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory) {
        return chat(systemPrompt, userMessage, conversationHistory, AiTaskType.DEFAULT);
    }

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory, AiTaskType taskType) {
        validateConfig();

        List<Map<String, Object>> contents = new ArrayList<>();

        if (conversationHistory != null) {
            for (String[] msg : conversationHistory) {
                contents.add(createContentPart(msg[0], msg[1]));
            }
        }

        contents.add(createContentPart("user", userMessage));

        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts", List.of(Map.of("text", systemPrompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 2048);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);
        requestBody.put("systemInstruction", systemInstruction);
        requestBody.put("generationConfig", generationConfig);

        String baseUrl = config.getGemini().getBaseUrl();
        String apiKeysStr = config.getGemini().getApiKeysStr();
        log.info("[GeminiProvider] CHAT REQUEST - BaseURL: {}", baseUrl);
        log.info("[GeminiProvider] CHAT REQUEST - API Key loaded: {}", (apiKeysStr != null && !apiKeysStr.isBlank()) ? "YES" : "NO");
        log.info("[GeminiProvider] CHAT REQUEST - Request body: {}", requestBody);
        long startMs = System.currentTimeMillis();

        return executeWithFallback("chat", (model, apiKey) -> {
            String keyMasked = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length() - 4);
            String requestUrl = baseUrl + "/v1beta/models/" + model + ":generateContent?key=" + keyMasked;
            log.info("[GeminiProvider] CHAT REQUEST - URL: {}", requestUrl);
            log.info("[GeminiProvider] CHAT REQUEST - Key index: {}/{}", keyManager.getKeyCount() > 0 ? "1" : "N/A", keyManager.getKeyCount());

            String rawResponse = webClientBuilder
                    .baseUrl(baseUrl)
                    .build()
                    .post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .block();

            long latencyMs = System.currentTimeMillis() - startMs;
            log.info("[GeminiProvider] CHAT RESPONSE - Model: {}, Latency: {}ms, Response length: {} chars", model, latencyMs, rawResponse != null ? rawResponse.length() : 0);
            return extractTextFromResponse(rawResponse);
        }, taskType);
    }

    // ============================================================
    // Question Generation Implementation
    // ============================================================

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty) {
        return generateQuestions(materialTitle, materialContent, questionCount, questionType, difficulty, AiTaskType.DEFAULT);
    }

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty, AiTaskType taskType) {
        validateConfig();

        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                materialTitle, materialContent, questionCount, questionType, difficulty);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(createContentPart("user", prompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 8192);
        requestBody.put("generationConfig", generationConfig);

        String rawText = executeWithFallback("question generation", (model, apiKey) -> {
            log.info("[GeminiProvider] QUESTION GENERATION - Attempting with model: {}", model);
            String rawResponse = webClientBuilder
                    .baseUrl(config.getGemini().getBaseUrl())
                    .build()
                    .post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .block();

            return extractTextFromResponse(rawResponse);
        }, taskType);

        return cleanJsonResponse(rawText);
    }

    // ============================================================
    // Exam Parsing Implementation
    // ============================================================

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        return parseExamFromText(extractedText, filename, AiTaskType.DEFAULT);
    }

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename, AiTaskType taskType) throws AiParsingException {
        try {
            validateConfig();
        } catch (IllegalStateException e) {
            throw new AiParsingException(e.getMessage(), e);
        }

        String prompt = AiPromptBuilder.buildExamParsingPrompt(extractedText, filename);
        long startMs = System.currentTimeMillis();

        try {
            Map<String, Object> response = executeWithFallback("exam parsing", (model, apiKey) -> {
                return callGeminiApi(model, apiKey, prompt);
            }, taskType);
            long latencyMs = System.currentTimeMillis() - startMs;
            log.info("Gemini API responded in {}ms for model {}", latencyMs, lastModelUsed);
            return parseResponse(response, latencyMs);
        } catch (Exception e) {
            log.error("Gemini exam parsing failed: {}", e.getMessage());
            throw new AiParsingException("Gemini request failed: " + e.getMessage(), e);
        }
    }

    // ============================================================
    // Translation Implementation
    // ============================================================

    @Override
    public String translate(List<String> texts, String prompt) {
        return translate(texts, prompt, AiTaskType.DEFAULT);
    }

    @Override
    public String translate(List<String> texts, String prompt, AiTaskType taskType) {
        validateConfig();

        int requestNumber = incrementAndGetPipelineCount();
        globalRequestCounter.incrementAndGet();
        int sentenceCount = texts != null ? texts.size() : 0;
        int promptLength = prompt != null ? prompt.length() : 0;
        int estimatedTokens = promptLength / 4;

        Instant requestTimestamp = Instant.now();

        log.info("=================================================");
        log.info("GEMINI REQUEST START #{}", requestNumber);
        log.info("=================================================");
        log.info("Request Number: {}", requestNumber);
        log.info("Timestamp: {}", requestTimestamp);
        log.info("Caller Class: GeminiProvider");
        log.info("Caller Method: translate()");
        log.info("Thread: {}", Thread.currentThread().getName());
        log.info("Prompt Length: {} chars", promptLength);
        log.info("Sentence Count: {}", sentenceCount);
        log.info("Estimated Tokens: ~{}", estimatedTokens);
        log.info("Pipeline Request Count: {}/global:{}", getPipelineRequestCount(), getGlobalRequestCount());
        log.info("=================================================");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(createContentPart("user", prompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 8192);
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        long startTime = System.currentTimeMillis();

        try {
            String rawResponse = executeWithFallback("translation", (model, apiKey) -> {
                String keyMasked = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length() - 4);
                String fullUrl = config.getGemini().getBaseUrl() + "/v1beta/models/" + model + ":generateContent?key=" + keyMasked;

                log.info("[GeminiProvider] Making HTTP POST request:");
                log.info("  URL: {}", fullUrl);
                log.info("  API Key: {} (index: {}/{})", keyMasked, keyManager.getKeyCount() > 0 ? "1" : "N/A", keyManager.getKeyCount());
                log.info("  Content-Type: application/json");
                log.info("  Request Body Size: {} bytes", requestBody.toString().length());

                long httpStart = System.currentTimeMillis();

                String rawResp = webClientBuilder
                        .baseUrl(config.getGemini().getBaseUrl())
                        .build()
                        .post()
                        .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                        .block();

                long httpDuration = System.currentTimeMillis() - httpStart;
                log.info("[GeminiProvider] HTTP request completed in {}ms", httpDuration);

                return rawResp;
            }, taskType);

            long totalDuration = System.currentTimeMillis() - startTime;
            int responseLength = rawResponse != null ? rawResponse.length() : 0;

            log.info("=================================================");
            log.info("GEMINI REQUEST END #{}", requestNumber);
            log.info("=================================================");
            log.info("Request Number: {}", requestNumber);
            log.info("Status: SUCCESS");
            log.info("Response Length: {} chars", responseLength);
            log.info("Execution Time: {}ms", totalDuration);
            log.info("Pipeline Request Count: {}/global:{}", getPipelineRequestCount(), getGlobalRequestCount());
            log.info("=================================================");

            return extractTextFromResponse(rawResponse);

        } catch (Exception e) {
            long totalDuration = System.currentTimeMillis() - startTime;

            log.error("=================================================");
            log.error("GEMINI REQUEST FAILED #{}", requestNumber);
            log.error("=================================================");
            log.error("Request Number: {}", requestNumber);
            log.error("Status: FAILED");
            log.error("Error: {}", e.getMessage());
            log.error("Execution Time: {}ms", totalDuration);
            log.error("Pipeline Request Count: {}/global:{}", getPipelineRequestCount(), getGlobalRequestCount());
            log.error("=================================================");

            throw e;
        }
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private Map<String, Object> callGeminiApi(String model, String apiKey, String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(createContentPart("user", prompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", config.getTemperature());
        generationConfig.put("maxOutputTokens", config.getMaxTokens());
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        String rawResponse = webClientBuilder
                .baseUrl(config.getGemini().getBaseUrl())
                .build()
                .post()
                .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .block();

        try {
            return objectMapper.readValue(rawResponse, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private Map<String, Object> createContentPart(String role, String content) {
        Map<String, Object> part = new HashMap<>();
        part.put("role", role);
        part.put("parts", List.of(Map.of("text", content)));
        return part;
    }

    private String extractTextFromResponse(String response) {
        try {
            if (response == null || response.isEmpty()) {
                throw new RuntimeException("Empty response from Gemini");
            }
            Map<String, Object> root = objectMapper.readValue(response, Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) root.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Gemini returned no candidates");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) {
                throw new RuntimeException("Gemini returned null content");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new RuntimeException("Gemini returned empty parts");
            }

            String text = (String) parts.get(0).get("text");
            if (text == null || text.isBlank()) {
                throw new RuntimeException("Gemini returned empty text");
            }

            return text;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GeminiProvider] Failed to parse response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private AiExamParseResponse parseResponse(Map<String, Object> response, long latencyMs) throws AiParsingException {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new AiParsingException("Gemini returned no candidates");
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new AiParsingException("Gemini returned null content");
        }

        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new AiParsingException("Gemini returned empty parts");
        }

        String text = (String) parts.get(0).get("text");
        if (text == null || text.isBlank()) {
            throw new AiParsingException("Gemini returned empty text part");
        }

        log.info("Gemini response content length: {} chars ({}ms)", text.length(), latencyMs);
        return parseJsonContent(text);
    }

    public AiExamParseResponse parseJsonContent(String rawContent) throws AiParsingException {
        String json = extractJson(rawContent);
        try {
            AiExamParseResponse result = objectMapper.readValue(json, AiExamParseResponse.class);
            validateResult(result);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse Gemini JSON response: {}\nContent: {}", e.getMessage(), json);
            throw new AiParsingException("AI returned malformed JSON: " + e.getMessage(), e);
        }
    }

    public String extractJson(String raw) {
        String trimmed = raw.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start == -1 || end == -1 || end <= start) {
            throw new AiParsingException("No JSON object found in response: " + trimmed.substring(0, Math.min(100, trimmed.length())));
        }
        return trimmed.substring(start, end + 1);
    }

    public String cleanJsonResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
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

    private void validateResult(AiExamParseResponse result) throws AiParsingException {
        if (result.getQuestions() == null || result.getQuestions().isEmpty()) {
            throw new AiParsingException("AI returned no questions in the exam");
        }
        for (int i = 0; i < result.getQuestions().size(); i++) {
            var q = result.getQuestions().get(i);
            if (q.getContent() == null || q.getContent().isBlank()) {
                throw new AiParsingException("Question " + (i + 1) + " has empty content");
            }
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) {
                throw new AiParsingException("Question " + (i + 1) + " has no answers");
            }
            long correctCount = q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correctCount != 1) {
                throw new AiParsingException("Question " + (i + 1) + " must have exactly one correct answer, found " + correctCount);
            }
        }
    }
}

package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.service.AiLlmProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenRouter AI LLM Provider with single-primary + optional 1-step fallback.
 *
 * <p>Design goals (post-incident 2026-07-07):
 * <ul>
 *   <li>Avoid 404-only models (e.g. deepseek/deepseek-chat-v3-0324:free).</li>
 *   <li>Avoid models that frequently hang/timeout (e.g. nvidia/nemotron-3-ultra-550b-a55b:free).</li>
 *   <li>Cap per-model timeout at ~15s for chat and ~25s for quiz generation.</li>
 *   <li>Cap model chain length to 2 (primary + at most 1 fallback).</li>
 *   <li>Do not leak API keys or full request bodies in logs.</li>
 * </ul>
 */
@Slf4j
@Component
public class OpenRouterAiProvider implements AiLlmProvider {

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    // Default per-purpose timeouts (configurable via application-local.yml).
    private static final int DEFAULT_CHAT_TIMEOUT_MS = 15000;
    private static final int DEFAULT_QUIZ_TIMEOUT_MS = 25000;
    private static final int DEFAULT_CONNECT_TIMEOUT_MS = 5000;

    // Default per-purpose max_tokens.
    private static final int DEFAULT_CHAT_MAX_TOKENS = 1400;
    private static final int DEFAULT_QUIZ_MAX_TOKENS = 4096;

    private static final double DEFAULT_STUDY_TEMPERATURE = 0.25;
    private static final double DEFAULT_QUIZ_TEMPERATURE = 0.2;

    /**
     * Models that have been observed to be consistently broken or pathological.
     * They are stripped from the configured model list to keep the active chain short.
     */
    private static final List<String> KNOWN_BAD_MODELS = List.of(
            "deepseek/deepseek-chat-v3-0324:free",       // 404
            "nvidia/nemotron-3-ultra-550b-a55b:free"     // ResourceExhausted, can hang 80s+
    );

    /**
     * Models that are rate-limited too often to be a safe primary.
     * They are demoted to fallback-only.
     */
    private static final List<String> OFTEN_RATE_LIMITED = List.of(
            "openai/gpt-oss-120b:free"
    );

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String referer;
    private final String appTitle;

    private final List<String> chatModels;
    private final List<String> quizModels;

    private final int chatTimeoutMs;
    private final int quizTimeoutMs;
    private final int chatMaxTokens;
    private final int quizMaxTokens;

    private volatile String lastModelUsed;

    public OpenRouterAiProvider(
            @Value("${OPENROUTER_API_KEY:}") String envApiKey,
            @Value("${ai.openrouter.api-key:}") String configApiKey,
            @Value("${ai.openrouter.models:openrouter/free}") String modelsConfig,
            @Value("${ai.openrouter.fallback-models:openai/gpt-oss-120b:free}") String fallbackModelsConfig,
            @Value("${ai.openrouter.referer:http://localhost:8081}") String referer,
            @Value("${ai.openrouter.app-title:MIDORI AI Sensei}") String appTitle,
            @Value("${ai.openrouter.chat-timeout-ms:" + DEFAULT_CHAT_TIMEOUT_MS + "}") int chatTimeoutMs,
            @Value("${ai.openrouter.quiz-timeout-ms:" + DEFAULT_QUIZ_TIMEOUT_MS + "}") int quizTimeoutMs,
            @Value("${ai.openrouter.connect-timeout-ms:" + DEFAULT_CONNECT_TIMEOUT_MS + "}") int connectTimeoutMs,
            @Value("${ai.openrouter.chat-max-tokens:" + DEFAULT_CHAT_MAX_TOKENS + "}") int chatMaxTokens,
            @Value("${ai.openrouter.quiz-max-tokens:" + DEFAULT_QUIZ_MAX_TOKENS + "}") int quizMaxTokens,
            ObjectMapper objectMapper) {
        this.apiKey = (envApiKey != null && !envApiKey.isBlank()) ? envApiKey : configApiKey;
        this.objectMapper = objectMapper;
        this.referer = referer;
        this.appTitle = appTitle;

        this.chatTimeoutMs = chatTimeoutMs > 0 ? chatTimeoutMs : DEFAULT_CHAT_TIMEOUT_MS;
        this.quizTimeoutMs = quizTimeoutMs > 0 ? quizTimeoutMs : DEFAULT_QUIZ_TIMEOUT_MS;
        this.chatMaxTokens = chatMaxTokens > 0 ? chatMaxTokens : DEFAULT_CHAT_MAX_TOKENS;
        this.quizMaxTokens = quizMaxTokens > 0 ? quizMaxTokens : DEFAULT_QUIZ_MAX_TOKENS;

        // Build model chain: primary first, then configured fallbacks (capped at 1).
        List<String> primary = sanitizeModels(parseModelsConfig(modelsConfig));
        List<String> fallbacks = sanitizeModels(parseModelsConfig(fallbackModelsConfig));

        if (primary.isEmpty()) {
            primary.add("openrouter/free");
        }

        // Demote often-rate-limited models out of the primary slot.
        primary = demoteFlaky(primary);

        this.chatModels = buildCappedChain(primary, fallbacks, 2);
        this.quizModels = buildCappedChain(primary, fallbacks, 2);

        // We do not log the full factory; the per-call RestTemplate is created lazily.
        this.chatFactory = buildFactory(this.chatTimeoutMs, connectTimeoutMs);
        this.quizFactory = buildFactory(this.quizTimeoutMs, connectTimeoutMs);

        log.info("[OpenRouterAiProvider] Initialized chat chain (size={}, timeoutMs={}, maxTokens={}): {}",
                this.chatModels.size(), this.chatTimeoutMs, this.chatMaxTokens, this.chatModels);
        log.info("[OpenRouterAiProvider] Initialized quiz chain (size={}, timeoutMs={}, maxTokens={}): {}",
                this.quizModels.size(), this.quizTimeoutMs, this.quizMaxTokens, this.quizModels);
        log.info("[OpenRouterAiProvider] API key present: {}",
                this.apiKey != null && !this.apiKey.isBlank() && !this.apiKey.startsWith("PASTE_"));
    }

    // Per-purpose RestTemplate factories with their own timeouts.
    private final SimpleClientHttpRequestFactory chatFactory;
    private final SimpleClientHttpRequestFactory quizFactory;

    private SimpleClientHttpRequestFactory buildFactory(int readTimeoutMs, int connectTimeoutMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        int connect = connectTimeoutMs > 0 ? connectTimeoutMs : DEFAULT_CONNECT_TIMEOUT_MS;
        f.setConnectTimeout(Duration.ofMillis(connect));
        f.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return f;
    }

    private List<String> parseModelsConfig(String modelsConfig) {
        List<String> result = new ArrayList<>();
        if (modelsConfig != null && !modelsConfig.isBlank()) {
            for (String m : modelsConfig.split(",")) {
                String trimmed = m.trim();
                if (!trimmed.isEmpty()) {
                    result.add(trimmed);
                }
            }
        }
        return result;
    }

    private List<String> sanitizeModels(List<String> input) {
        List<String> out = new ArrayList<>();
        if (input == null) return out;
        for (String m : input) {
            if (m == null) continue;
            String trimmed = m.trim();
            if (trimmed.isEmpty()) continue;
            if (KNOWN_BAD_MODELS.contains(trimmed)) {
                log.info("[OpenRouterAiProvider] Skipping known-bad model from config: {}", trimmed);
                continue;
            }
            out.add(trimmed);
        }
        return out;
    }

    private List<String> demoteFlaky(List<String> input) {
        List<String> clean = new ArrayList<>();
        List<String> demoted = new ArrayList<>();
        for (String m : input) {
            if (OFTEN_RATE_LIMITED.contains(m)) {
                demoted.add(m);
            } else {
                clean.add(m);
            }
        }
        clean.addAll(demoted);
        return clean;
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

    @Override
    public String getProviderName() {
        return "OpenRouter";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("PASTE_");
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
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory) {
        if (!isConfigured()) {
            throw new IllegalStateException("AI provider is not configured. Please set OPENROUTER_API_KEY or ai.openrouter.api-key in application-local.yml");
        }

        Throwable lastError = null;
        for (int attempt = 0; attempt < chatModels.size(); attempt++) {
            String model = chatModels.get(attempt);
            long start = System.currentTimeMillis();
            try {
                String response = callChat(model, systemPrompt, userMessage, conversationHistory,
                        chatMaxTokens, DEFAULT_STUDY_TEMPERATURE, chatFactory);
                long duration = System.currentTimeMillis() - start;
                log.info("OpenRouter model={} durationMs={} status=OK", model, duration);
                lastModelUsed = model;
                return response;
            } catch (AuthException e) {
                long duration = System.currentTimeMillis() - start;
                log.error("OpenRouter model={} durationMs={} status=AUTH reason={}", model, duration, e.getMessage());
                throw e;
            } catch (NonRetryableException e) {
                // 404 / 400 / hard errors: do not try next model with the same problem
                long duration = System.currentTimeMillis() - start;
                log.error("OpenRouter model={} durationMs={} status=NON_RETRYABLE reason={}",
                        model, duration, e.getMessage());
                throw new RuntimeException("AI không phản hồi được: " + e.getMessage());
            } catch (RetryableException e) {
                long duration = System.currentTimeMillis() - start;
                log.warn("OpenRouter model={} durationMs={} status=RETRY reason={}",
                        model, duration, e.getMessage());
                lastError = e;
                // fallthrough to next model
            } catch (Exception e) {
                long duration = System.currentTimeMillis() - start;
                log.warn("OpenRouter model={} durationMs={} status=UNEXPECTED reason={}",
                        model, duration, e.getMessage());
                lastError = e;
            }
        }

        log.error("OpenRouter all chat models exhausted (chainSize={})", chatModels.size());
        String msg = lastError != null ? lastError.getMessage() : "Không rõ";
        if (msg.contains("429") || msg.toLowerCase().contains("rate") || msg.toLowerCase().contains("timeout")) {
            throw new RuntimeException("AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        }
        throw new RuntimeException("AI không phản hồi được. Vui lòng thử lại sau.");
    }

    private String callChat(String model, String systemPrompt, String userMessage,
                            List<String[]> conversationHistory,
                            int maxTokens, double temperature,
                            SimpleClientHttpRequestFactory factory) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

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
        // OpenRouter uses OpenAI-style "max_tokens" at the top level.
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
            ResponseEntity<String> response = rt.postForEntity(OPENROUTER_API_URL, request, String.class);
            String content = extractTextFromResponse(response.getBody(), model);
            log.debug("[OpenRouterAiProvider] Model {} returned {} chars", model, content.length());
            return content;
        } catch (HttpClientErrorException e) {
            handleHttpError(e, model);
            // unreachable, handleHttpError always throws
            throw new RetryableException("HTTP error: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            // SocketTimeout / read timeout
            throw new RetryableException("timeout");
        }
    }

    @Override
    public String generateQuestions(String materialTitle, String materialContent, int questionCount, String questionType, String difficulty) {
        if (!isConfigured()) {
            throw new IllegalStateException("AI provider is not configured. Please set OPENROUTER_API_KEY or ai.openrouter.api-key in application-local.yml");
        }

        String prompt = buildQuestionGenerationPrompt(materialTitle, materialContent, questionCount, questionType, difficulty);

        Throwable lastError = null;
        for (int attempt = 0; attempt < quizModels.size(); attempt++) {
            String model = quizModels.get(attempt);
            long start = System.currentTimeMillis();
            try {
                String response = callGenerateQuestions(model, prompt, quizMaxTokens, DEFAULT_QUIZ_TEMPERATURE, quizFactory);
                String cleaned = cleanJsonResponse(response);
                validateQuizJson(cleaned, questionType);
                long duration = System.currentTimeMillis() - start;
                log.info("OpenRouter model={} durationMs={} status=OK kind=quiz", model, duration);
                lastModelUsed = model;
                return cleaned;
            } catch (AuthException e) {
                long duration = System.currentTimeMillis() - start;
                log.error("OpenRouter model={} durationMs={} status=AUTH kind=quiz reason={}", model, duration, e.getMessage());
                throw e;
            } catch (InvalidJsonException e) {
                long duration = System.currentTimeMillis() - start;
                log.warn("OpenRouter model={} durationMs={} status=INVALID_JSON kind=quiz reason={}",
                        model, duration, e.getMessage());
                lastError = e;
                // Try next model
            } catch (NonRetryableException e) {
                long duration = System.currentTimeMillis() - start;
                log.error("OpenRouter model={} durationMs={} status=NON_RETRYABLE kind=quiz reason={}",
                        model, duration, e.getMessage());
                throw new RuntimeException("AI không phản hồi được: " + e.getMessage());
            } catch (RetryableException e) {
                long duration = System.currentTimeMillis() - start;
                log.warn("OpenRouter model={} durationMs={} status=RETRY kind=quiz reason={}",
                        model, duration, e.getMessage());
                lastError = e;
            } catch (Exception e) {
                long duration = System.currentTimeMillis() - start;
                log.warn("OpenRouter model={} durationMs={} status=UNEXPECTED kind=quiz reason={}",
                        model, duration, e.getMessage());
                lastError = e;
            }
        }

        log.error("OpenRouter all quiz models exhausted (chainSize={})", quizModels.size());
        String msg = lastError != null ? lastError.getMessage() : "Không rõ";
        if (msg.contains("429") || msg.toLowerCase().contains("rate") || msg.toLowerCase().contains("timeout")) {
            throw new RuntimeException("AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.");
        }
        if (msg.toLowerCase().contains("invalid") || msg.toLowerCase().contains("json")) {
            throw new RuntimeException("AI trả dữ liệu không hợp lệ. Đang dùng quiz local.");
        }
        throw new RuntimeException("AI không phản hồi được. Vui lòng thử lại sau.");
    }

    private String callGenerateQuestions(String model, String prompt,
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
            ResponseEntity<String> response = rt.postForEntity(OPENROUTER_API_URL, request, String.class);
            return extractTextFromResponse(response.getBody(), model);
        } catch (HttpClientErrorException e) {
            handleHttpError(e, model);
            throw new RetryableException("HTTP error: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new RetryableException("timeout");
        }
    }

    private void handleHttpError(HttpClientErrorException e, String model) {
        HttpStatusCode status = e.getStatusCode();
        int code = status.value();
        if (code == 401 || code == 403) {
            throw new AuthException("API key không hợp lệ hoặc bị từ chối (HTTP " + code + ").");
        }
        if (code == 404) {
            // Model not found on OpenRouter - never retry.
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
            // Other 400: don't blindly retry the same payload on the next model.
            throw new NonRetryableException("Yêu cầu không hợp lệ (HTTP 400).");
        }
        // Unknown error code: retry once on the next model.
        throw new RetryableException("HTTP " + code);
    }

    private String buildQuestionGenerationPrompt(String materialTitle, String materialContent, int questionCount, String questionType, String difficulty) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật.\n\n");
        prompt.append("Nhiệm vụ: Tạo ").append(questionCount).append(" câu hỏi quiz từ tài liệu học tập sau đây.\n\n");
        prompt.append("TÀI LIỆU: ").append(materialTitle).append("\n\n");

        if (materialContent != null && !materialContent.isBlank()) {
            prompt.append("NỘI DUNG:\n").append(materialContent).append("\n\n");
        }

        prompt.append("QUY TẮC BẮT BUỘC:\n");
        prompt.append("1. Chỉ trả JSON thuần, KHÔNG có ```json, KHÔNG có markdown, KHÔNG có giải thích ngoài JSON.\n");
        prompt.append("2. Mỗi câu hỏi bắt buộc có: id, type, question, options, correctAnswer, explanation.\n");
        prompt.append("3. Số lượng câu hỏi: ").append(questionCount).append("\n");
        prompt.append("4. Tất cả câu hỏi phải cùng 1 loại: ").append(questionType).append(".\n");
        prompt.append("5. KHÔNG được trả loại khác ").append(questionType).append(" trong mảng questions.\n\n");

        prompt.append("CẤU TRÚC CHO PHÉP:\n");
        prompt.append("- MULTIPLE_CHOICE: options có 4 đáp án, correctAnswer là 1 trong 4.\n");
        prompt.append("- TRUE_FALSE: options là [\"Đúng\", \"Sai\"], correctAnswer là \"Đúng\" hoặc \"Sai\".\n");
        prompt.append("- FILL_BLANK: options là [], correctAnswer là đáp án đúng dạng text.\n");
        prompt.append("- MIXED: xen kẽ các loại trên.\n\n");

        prompt.append("NGUYÊN TẮC CHỐNG LỘ ĐÁP ÁN:\n");
        prompt.append("- Với từ vựng tiếng Nhật, chỉ dùng 1 trong các dạng an toàn:\n");
        prompt.append("  + Hỏi nghĩa: '... có nghĩa là gì?', options là các nghĩa tiếng Việt.\n");
        prompt.append("  + Hỏi chọn từ: 'Từ nào có nghĩa là ...?', options là các từ tiếng Nhật.\n");
        prompt.append("  + Hỏi cách đọc: 'Cách đọc đúng của ... là gì?', options là các romaji.\n");
        prompt.append("- KHÔNG tạo câu vừa cho nghĩa vừa cho romaji trong options.\n");
        prompt.append("- KHÔNG để options hiển thị cả từ + nghĩa/romaji làm lộ đáp án ngay.\n\n");

        prompt.append("Định dạng JSON chính xác:\n");
        prompt.append("{\n");
        prompt.append("  \"questions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"id\": \"q_0\",\n");
        prompt.append("      \"type\": \"").append(questionType).append("\",\n");
        prompt.append("      \"question\": \"Câu hỏi bằng tiếng Việt, bám vào nội dung tài liệu\",\n");
        prompt.append("      \"options\": [\"Đáp án A\", \"Đáp án B\", \"Đáp án C\", \"Đáp án D\"],\n");
        prompt.append("      \"correctAnswer\": \"Đáp án đúng\",\n");
        prompt.append("      \"explanation\": \"Giải thích ngắn gọn tại sao đáp án này đúng\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");

        return prompt.toString();
    }

    private String cleanJsonResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidJsonException("Empty response");
        }

        String cleaned = raw.trim();

        // Remove markdown code blocks
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }

        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        cleaned = cleaned.trim();

        // Find the first { and last }
        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return cleaned.trim();
    }

    private void validateQuizJson(String json, String expectedQuestionType) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode questionsNode = root.path("questions");

            if (!questionsNode.isArray() || questionsNode.isEmpty()) {
                throw new InvalidJsonException("Missing or empty 'questions' array");
            }

            for (JsonNode qNode : questionsNode) {
                String question = qNode.path("question").asText("");
                String correctAnswer = qNode.path("correctAnswer").asText("");
                String explanation = qNode.path("explanation").asText("");

                if (question.isBlank()) {
                    throw new InvalidJsonException("Question missing text");
                }
                if (correctAnswer.isBlank()) {
                    throw new InvalidJsonException("correctAnswer missing");
                }
                if (explanation.isBlank()) {
                    log.warn("[OpenRouterAiProvider] Question missing explanation, will auto-fill");
                }

                String type = qNode.path("type").asText("").toUpperCase();
                if (type.isBlank()) {
                    type = "MULTIPLE_CHOICE";
                }
                if (!"MULTIPLE_CHOICE".equals(type) && !"TRUE_FALSE".equals(type) && !"FILL_BLANK".equals(type)) {
                    throw new InvalidJsonException("Invalid question type: " + type);
                }
                if (!"MIXED".equals(expectedQuestionType) && !expectedQuestionType.equals(type)) {
                    throw new InvalidJsonException("Expected all questions to be " + expectedQuestionType + ", but found " + type);
                }

                JsonNode optionsNode = qNode.path("options");
                if ("MULTIPLE_CHOICE".equals(type)) {
                    if (!optionsNode.isArray() || optionsNode.size() < 2) {
                        throw new InvalidJsonException("MULTIPLE_CHOICE must have at least 2 options");
                    }
                    boolean found = false;
                    for (JsonNode opt : optionsNode) {
                        if (expectedQuestionType.equals("TRUE_FALSE") || expectedQuestionType.equals("FILL_BLANK") || opt.asText().equals(correctAnswer)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new InvalidJsonException("correctAnswer must be present in options");
                    }
                }
            }
        } catch (InvalidJsonException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidJsonException("Parse error: " + e.getMessage());
        }
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
                log.error("[OpenRouterAiProvider] OpenRouter error: {}", errorMsg);
                if (errorMsg.toLowerCase().contains("unauthorized") || errorMsg.toLowerCase().contains("invalid api key")) {
                    throw new AuthException("API key không hợp lệ: " + errorMsg);
                }
                if (errorMsg.toLowerCase().contains("not found") || errorMsg.toLowerCase().contains("model")) {
                    throw new NonRetryableException("Model không hợp lệ: " + errorMsg);
                }
                throw new RetryableException("OpenRouter error: " + errorMsg);
            }
            log.error("[OpenRouterAiProvider] Invalid response format");
            throw new RetryableException("Invalid response format from model " + model);
        } catch (AuthException | RetryableException | NonRetryableException e) {
            throw e;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[OpenRouterAiProvider] Failed to parse response: {}", e.getMessage());
            throw new RetryableException("Failed to parse response: " + e.getMessage());
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
    private static class InvalidJsonException extends RuntimeException {
        InvalidJsonException(String msg) { super(msg); }
    }
}

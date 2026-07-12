package com.midori.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.AiParsingException;
import com.midori.ai.prompt.AiPromptBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Unified OpenAI Provider implementing AiProvider interface.
 * 
 * Supports:
 * - Chat/Conversation
 * - Question Generation
 * - Exam Parsing (PDF)
 */
@Slf4j
@Component
public class OpenAiProvider implements AiProvider {

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;
    private volatile String lastModelUsed;

    public OpenAiProvider(AiConfigProperties config, ObjectMapper objectMapper, WebClient.Builder webClientBuilder) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.OPENAI;
    }

    @Override
    public String getName() {
        return "OpenAI " + config.getOpenai().getModel();
    }

    @Override
    public boolean isConfigured() {
        return config.getOpenai().isConfigured();
    }

    @Override
    public List<String> getModels() {
        return List.of(config.getOpenai().getModel());
    }

    @Override
    public String getLastModelUsed() {
        return lastModelUsed;
    }

    // ============================================================
    // Chat Implementation
    // ============================================================

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI API key is not configured.");
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (conversationHistory != null) {
            for (String[] msg : conversationHistory) {
                String role = "USER".equalsIgnoreCase(msg[0]) ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg[1]));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getOpenai().getModel());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2048);

        return callOpenAiApi(requestBody);
    }

    // ============================================================
    // Question Generation Implementation
    // ============================================================

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                materialTitle, materialContent, questionCount, questionType, difficulty);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getOpenai().getModel());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);
        requestBody.put("max_tokens", 4096);

        String response = callOpenAiApi(requestBody);
        return cleanJsonResponse(response);
    }

    // ============================================================
    // Exam Parsing Implementation
    // ============================================================

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        if (!isConfigured()) {
            throw new AiParsingException("OpenAI API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildExamParsingPrompt(extractedText, filename);
        long startMs = System.currentTimeMillis();

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getOpenai().getModel());
        requestBody.put("messages", messages);
        requestBody.put("temperature", config.getTemperature());
        requestBody.put("max_tokens", config.getMaxTokens());

        try {
            Map<String, Object> response = callOpenAiApiRaw(requestBody);
            long latencyMs = System.currentTimeMillis() - startMs;
            log.info("OpenAI API responded in {}ms for model {}", latencyMs, config.getOpenai().getModel());
            return parseResponse(response, latencyMs);
        } catch (WebClientResponseException e) {
            log.error("OpenAI API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiParsingException("OpenAI API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        }
    }

    // ============================================================
    // Translation Implementation (OpenAI doesn't support this well, throw exception)
    // ============================================================

    @Override
    public String translate(List<String> texts, String prompt) {
        throw new UnsupportedOperationException("OpenAI provider does not support translation. Use GeminiProvider instead.");
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private String callOpenAiApi(Map<String, Object> requestBody) {
        try {
            Map<String, Object> response = callOpenAiApiRaw(requestBody);
            return extractContentFromResponse(response);
        } catch (WebClientResponseException e) {
            log.error("OpenAI API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("OpenAI API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOpenAiApiRaw(Map<String, Object> requestBody) {
        return webClientBuilder
                .baseUrl(config.getOpenai().getBaseUrl())
                .build()
                .post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + config.getOpenai().getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .block();
    }

    @SuppressWarnings("unchecked")
    private String extractContentFromResponse(Map<String, Object> response) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("OpenAI returned empty choices");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new RuntimeException("OpenAI returned null message");
        }

        String content = (String) message.get("content");
        if (content == null || content.isBlank()) {
            throw new RuntimeException("OpenAI returned empty content");
        }

        lastModelUsed = config.getOpenai().getModel();
        return content;
    }

    @SuppressWarnings("unchecked")
    private AiExamParseResponse parseResponse(Map<String, Object> response, long latencyMs) throws AiParsingException {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new AiParsingException("OpenAI returned empty choices");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new AiParsingException("OpenAI returned null message");
        }

        String content = (String) message.get("content");
        if (content == null || content.isBlank()) {
            throw new AiParsingException("OpenAI returned empty content");
        }

        log.info("OpenAI response content length: {} chars ({}ms)", content.length(), latencyMs);
        return parseJsonContent(content);
    }

    public AiExamParseResponse parseJsonContent(String rawContent) throws AiParsingException {
        String json = extractJson(rawContent);
        try {
            AiExamParseResponse result = objectMapper.readValue(json, AiExamParseResponse.class);
            validateResult(result);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse AI JSON response: {}\nContent: {}", e.getMessage(), json);
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
            AiExamParseResponse.AiQuestionDto q = result.getQuestions().get(i);
            if (q.getContent() == null || q.getContent().isBlank()) {
                throw new AiParsingException("Question " + (i + 1) + " has empty content");
            }
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) {
                throw new AiParsingException("Question " + (i + 1) + " (" + q.getContent() + ") has no answers");
            }
            long correctCount = q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correctCount != 1) {
                throw new AiParsingException("Question " + (i + 1) + " must have exactly one correct answer, found " + correctCount);
            }
        }
    }
}

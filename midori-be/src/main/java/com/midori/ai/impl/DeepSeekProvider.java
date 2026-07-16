package com.midori.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.config.AiConfigProperties;
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
 * Unified DeepSeek Provider implementing AiProvider interface.
 * 
 * Supports:
 * - Chat/Conversation
 * - Question Generation
 * - Exam Parsing (PDF)
 */
@Slf4j
@Component
public class DeepSeekProvider implements AiProvider {

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;
    private volatile String lastModelUsed;

    public DeepSeekProvider(AiConfigProperties config, ObjectMapper objectMapper, WebClient.Builder webClientBuilder) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.DEEPSEEK;
    }

    @Override
    public String getName() {
        return "DeepSeek " + config.getDeepseek().getModel();
    }

    @Override
    public boolean isConfigured() {
        return config.getDeepseek().isConfigured();
    }

    @Override
    public List<String> getModels() {
        return List.of(config.getDeepseek().getModel());
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
            throw new IllegalStateException("DeepSeek API key is not configured.");
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
        requestBody.put("model", config.getDeepseek().getModel());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.25);
        requestBody.put("max_tokens", 1024);
        requestBody.put("top_p", 0.8);
        requestBody.put("frequency_penalty", 0.3);
        requestBody.put("presence_penalty", 0.0);

        return callDeepSeekApi(requestBody);
    }

    // ============================================================
    // Question Generation Implementation
    // ============================================================

    @Override
    public String generateQuestions(String materialTitle, String materialContent,
                                   int questionCount, String questionType, String difficulty) {
        if (!isConfigured()) {
            throw new IllegalStateException("DeepSeek API key is not configured.");
        }

        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                materialTitle, materialContent, questionCount, questionType, difficulty);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getDeepseek().getModel());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);
        requestBody.put("max_tokens", 4096);

        String response = callDeepSeekApi(requestBody);
        return cleanJsonResponse(response);
    }

    // ============================================================
    // Exam Parsing Implementation
    // ============================================================


    // ============================================================
    // Helper Methods
    // ============================================================

    private String callDeepSeekApi(Map<String, Object> requestBody) {
        try {
            Map<String, Object> response = callDeepSeekApiRaw(requestBody);
            return extractContentFromResponse(response);
        } catch (WebClientResponseException e) {
            log.error("DeepSeek API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("DeepSeek API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callDeepSeekApiRaw(Map<String, Object> requestBody) {
        return webClientBuilder
                .baseUrl(config.getDeepseek().getBaseUrl())
                .build()
                .post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + config.getDeepseek().getApiKey())
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
            throw new RuntimeException("DeepSeek returned empty choices");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new RuntimeException("DeepSeek returned null message");
        }

        String content = (String) message.get("content");
        if (content == null || content.isBlank()) {
            throw new RuntimeException("DeepSeek returned empty content");
        }

        lastModelUsed = config.getDeepseek().getModel();
        return content;
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
}

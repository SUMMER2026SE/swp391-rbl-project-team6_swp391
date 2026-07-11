package com.midori.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiParsingException;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.ExamParsingPrompt;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class GeminiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiProvider.class);

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;

    public GeminiProvider(AiConfigProperties config, ObjectMapper objectMapper, WebClient.Builder webClientBuilder) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.GEMINI;
    }

    @Override
    public String getName() {
        return "Google Gemini " + config.getGemini().getModel();
    }

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        if (config.getGemini().getApiKey() == null || config.getGemini().getApiKey().isBlank()) {
            throw new AiParsingException("Gemini API key is not configured. Set ai.gemini.api-key in application properties.");
        }

        String prompt = ExamParsingPrompt.buildPrompt(extractedText, filename);
        String model = config.getGemini().getModel();
        long startMs = System.currentTimeMillis();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClientBuilder
                    .baseUrl(config.getGemini().getBaseUrl())
                    .build()
                    .post()
                    .uri("/v1beta/{model}:generateContent?key={key}", model, config.getGemini().getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "contents", List.of(Map.of(
                                    "parts", List.of(Map.of("text", prompt))
                            )),
                            "generationConfig", Map.of(
                                    "temperature", config.getTemperature(),
                                    "maxOutputTokens", config.getMaxTokens(),
                                    "responseMimeType", "application/json"
                            )
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .block();

            long latencyMs = System.currentTimeMillis() - startMs;
            log.info("Gemini API responded in {}ms for model {}", latencyMs, model);

            return parseResponse(response, latencyMs);

        } catch (WebClientResponseException e) {
            log.error("Gemini API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiParsingException("Gemini API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Gemini request failed: {}", e.getMessage(), e);
            throw new AiParsingException("Gemini request failed: " + e.getMessage(), e);
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

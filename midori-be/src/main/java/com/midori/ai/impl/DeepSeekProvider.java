package com.midori.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiParsingException;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.ExamParsingPrompt;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class DeepSeekProvider implements AiProvider {

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;

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
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        if (config.getDeepseek().getApiKey() == null || config.getDeepseek().getApiKey().isBlank()) {
            throw new AiParsingException(
                    "DeepSeek API key is not configured. Set app.ai.deepseek.api-key in application properties.");
        }

        String prompt = ExamParsingPrompt.buildPrompt(extractedText, filename);
        String model = config.getDeepseek().getModel();
        long startMs = System.currentTimeMillis();

        try {
            Map<String, Object> response = webClientBuilder
                    .baseUrl(config.getDeepseek().getBaseUrl())
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + config.getDeepseek().getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "model", model,
                            "messages", List.of(Map.of(
                                    "role", "user",
                                    "content", prompt
                            )),
                            "temperature", config.getTemperature(),
                            "max_tokens", config.getMaxTokens()
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .block();

            long latencyMs = System.currentTimeMillis() - startMs;
            log.info("DeepSeek API responded in {}ms for model {}", latencyMs, model);

            return parseResponse(response, latencyMs);

        } catch (WebClientResponseException e) {
            log.error("DeepSeek API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiParsingException("DeepSeek API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("DeepSeek request failed: {}", e.getMessage(), e);
            throw new AiParsingException("DeepSeek request failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private AiExamParseResponse parseResponse(Map<String, Object> response, long latencyMs) throws AiParsingException {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new AiParsingException("DeepSeek returned empty choices");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new AiParsingException("DeepSeek returned null message");
        }

        String content = (String) message.get("content");
        if (content == null || content.isBlank()) {
            throw new AiParsingException("DeepSeek returned empty content");
        }

        log.info("DeepSeek response content length: {} chars ({}ms)", content.length(), latencyMs);
        return parseJsonContent(content);
    }

    protected AiExamParseResponse parseJsonContent(String rawContent) throws AiParsingException {
        String json = extractJson(rawContent);
        try {
            AiExamParseResponse result = objectMapper.readValue(json, AiExamParseResponse.class);
            validateResult(result);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse DeepSeek JSON response: {}\nContent: {}", e.getMessage(), json);
            throw new AiParsingException("AI returned malformed JSON: " + e.getMessage(), e);
        }
    }

    protected String extractJson(String raw) {
        String trimmed = raw.trim();
        int start = trimmed.indexOf("{");
        int end = trimmed.lastIndexOf("}");
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

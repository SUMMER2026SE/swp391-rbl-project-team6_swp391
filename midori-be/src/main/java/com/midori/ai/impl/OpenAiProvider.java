package com.midori.ai.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiParsingException;
import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderType;
import com.midori.ai.ExamParsingPrompt;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiProvider implements AiProvider {

    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;

    @Override
    public AiProviderType getType() {
        return AiProviderType.OPENAI;
    }

    @Override
    public String getName() {
        return "OpenAI " + config.getOpenai().getModel();
    }

    @Override
    public AiExamParseResponse parseExamFromText(String extractedText, String filename) throws AiParsingException {
        if (config.getOpenai().getApiKey() == null || config.getOpenai().getApiKey().isBlank()) {
            throw new AiParsingException("OpenAI API key is not configured. Set app.ai.openai.api-key in application properties.");
        }

        String prompt = ExamParsingPrompt.buildPrompt(extractedText, filename);
        String model = config.getOpenai().getModel();
        long startMs = System.currentTimeMillis();

        try {
            Map<String, Object> response = webClientBuilder
                    .baseUrl(config.getOpenai().getBaseUrl())
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + config.getOpenai().getApiKey())
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
            log.info("OpenAI API responded in {}ms for model {}", latencyMs, model);

            return parseResponse(response, latencyMs);

        } catch (WebClientResponseException e) {
            log.error("OpenAI API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiParsingException("OpenAI API error: " + e.getStatusCode() + " — " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("OpenAI request failed: {}", e.getMessage(), e);
            throw new AiParsingException("OpenAI request failed: " + e.getMessage(), e);
        }
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

    protected AiExamParseResponse parseJsonContent(String rawContent) throws AiParsingException {
        String json = extractJson(rawContent);
        try {
            AiExamParseResponse result = objectMapper.readValue(json, AiExamParseResponse.class);
            validateResult(result);
            return result;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI JSON response: {}\nContent: {}", e.getMessage(), json);
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
            AiExamParseResponse.AiQuestionDto q = result.getQuestions().get(i);
            if (q.getContent() == null || q.getContent().isBlank()) {
                throw new AiParsingException("Question " + (i + 1) + " has empty content");
            }
            if (q.getAnswers() == null || q.getAnswers().isEmpty()) {
                throw new AiParsingException("Question " + (i + 1) + " (" + q.getContent() + ") has no answers");
            }
            long correctCount = q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            if (correctCount != 1) {
                throw new AiParsingException(
                        "Question " + (i + 1) + " must have exactly one correct answer, found " + correctCount);
            }
        }
    }
}

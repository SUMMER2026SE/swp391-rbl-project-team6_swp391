package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.service.AiLlmProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gemini AI LLM Provider implementation using RestTemplate.
 */
@Slf4j
@Component
public class GeminiAiProvider implements AiLlmProvider {

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private volatile String lastModelUsed;

    public GeminiAiProvider(
            @Value("${GEMINI_API_KEY:}") String envApiKey,
            @Value("${ai.gemini.api-key:}") String configApiKey,
            ObjectMapper objectMapper) {
        // Environment variable takes precedence, then Spring config property
        this.apiKey = (envApiKey != null && !envApiKey.isBlank()) ? envApiKey : configApiKey;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();

        // Safe logging - only log that key exists, not the key itself
        log.info("[GeminiAiProvider] Initializing with env key: {}, config key: {}",
                envApiKey != null && !envApiKey.isBlank() ? "present" : "missing",
                configApiKey != null && !configApiKey.isBlank() ? "present (length=" + configApiKey.length() + ")" : "missing");
    }

    @Override
    public String getProviderName() {
        return "Google Gemini";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public List<String> getModels() {
        return List.of("gemini-2.0-flash");
    }

    @Override
    public String getLastModelUsed() {
        return lastModelUsed;
    }

    @Override
    public String chat(String systemPrompt, String userMessage, List<String[]> conversationHistory) {
        if (!isConfigured()) {
            log.error("[GeminiAiProvider] API key not configured");
            throw new IllegalStateException("AI provider is not configured. Please set GEMINI_API_KEY or ai.gemini.api-key in application-local.yml");
        }

        try {
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add conversation history
            if (conversationHistory != null) {
                for (String[] msg : conversationHistory) {
                    String role = msg[0];
                    String content = msg[1];
                    contents.add(createContentPart(role, content));
                }
            }

            // Add current user message
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

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            log.debug("[GeminiAiProvider] Calling Gemini API with {} messages", contents.size());

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + "?key=" + apiKey,
                    request,
                    String.class
            );

            log.debug("[GeminiAiProvider] Gemini API response received, status: {}", response.getStatusCode());
            lastModelUsed = "gemini-2.0-flash";
            return extractTextFromResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            // Parse Gemini error response for more details
            String geminiError = parseGeminiError(e);
            log.error("[GeminiAiProvider] HTTP error calling Gemini: {} - {}", e.getStatusCode(), geminiError);
            throw new RuntimeException("Gemini API error (" + e.getStatusCode() + "): " + geminiError, e);
        } catch (Exception e) {
            log.error("[GeminiAiProvider] Error calling Gemini: {}", e.getMessage());
            throw new RuntimeException("Failed to get response from Gemini: " + e.getMessage(), e);
        }
    }

    private String parseGeminiError(HttpClientErrorException e) {
        try {
            JsonNode errorNode = objectMapper.readTree(e.getResponseBodyAsString());
            JsonNode error = errorNode.path("error");
            if (error.has("message")) {
                return error.path("message").asText();
            }
            // Try to extract from details
            JsonNode details = error.path("details");
            if (details.isArray() && !details.isEmpty()) {
                for (JsonNode detail : details) {
                    if (detail.has("error_message")) {
                        return detail.path("error_message").asText();
                    }
                }
            }
            return e.getResponseBodyAsString();
        } catch (Exception ex) {
            return e.getResponseBodyAsString();
        }
    }

    @Override
    public String generateQuestions(String materialTitle, String materialContent, int questionCount, String questionType, String difficulty) {
        if (!isConfigured()) {
            log.error("[GeminiAiProvider] API key not configured for generateQuestions");
            throw new IllegalStateException("AI provider is not configured. Please set GEMINI_API_KEY or ai.gemini.api-key in application-local.yml");
        }

        String prompt = buildQuestionGenerationPrompt(materialTitle, materialContent, questionCount, questionType, difficulty);

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(createContentPart("user", prompt)));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 8192);
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            log.debug("[GeminiAiProvider] Generating questions via Gemini API");

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + "?key=" + apiKey,
                    request,
                    String.class
            );

            log.debug("[GeminiAiProvider] Gemini API response received for questions, status: {}", response.getStatusCode());
            lastModelUsed = "gemini-2.0-flash";
            return extractTextFromResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            String geminiError = parseGeminiError(e);
            log.error("[GeminiAiProvider] HTTP error generating questions from Gemini: {} - {}", e.getStatusCode(), geminiError);
            throw new RuntimeException("Gemini API error (" + e.getStatusCode() + "): " + geminiError, e);
        } catch (Exception e) {
            log.error("[GeminiAiProvider] Error generating questions from Gemini: {}", e.getMessage());
            throw new RuntimeException("Failed to generate questions from Gemini: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> createContentPart(String role, String content) {
        Map<String, Object> part = new HashMap<>();
        part.put("role", role);
        part.put("parts", List.of(Map.of("text", content)));
        return part;
    }

    private String buildQuestionGenerationPrompt(String materialTitle, String materialContent, int questionCount, String questionType, String difficulty) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Bạn là AI Sensei của MIDORI, trợ lý học tiếng Nhật.\n\n");
        prompt.append("Nhiệm vụ: Tạo ").append(questionCount).append(" câu hỏi quiz từ tài liệu học tập sau đây.\n\n");
        prompt.append("TÀI LIỆU: ").append(materialTitle).append("\n\n");
        prompt.append("NỘI DUNG:\n").append(materialContent).append("\n\n");

        prompt.append("QUY TẮC BẮT BUỘC:\n");
        prompt.append("1. Chỉ trả JSON thuần, KHÔNG có ```json, KHÔNG có markdown, KHÔNG có giải thích ngoài JSON.\n");
        prompt.append("2. Mỗi câu hỏi bắt buộc có: id, type, question, options, correctAnswer, explanation.\n");
        prompt.append("3. Tất cả câu hỏi phải cùng 1 loại: ").append(questionType).append(".\n");
        prompt.append("4. KHÔNG được trả loại khác ").append(questionType).append(" trong mảng questions.\n");
        prompt.append("5. Số câu hỏi: ").append(questionCount).append(". Độ khó: ").append(difficulty).append(".\n\n");

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

        prompt.append("Định dạng JSON:\n");
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
        prompt.append("}\n\n");

        if ("MIXED".equalsIgnoreCase(questionType)) {
            prompt.append("Với MIXED, kết hợp các loại: MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE.\n");
        }

        return prompt.toString();
    }

    private String extractTextFromResponse(String response) {
        try {
            if (response == null || response.isEmpty()) {
                log.error("[GeminiAiProvider] Empty response from Gemini");
                throw new RuntimeException("Empty response from Gemini");
            }
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText();
                    log.debug("[GeminiAiProvider] Extracted text length: {}", text.length());
                    return text;
                }
            }
            // Check for error in response
            JsonNode error = root.path("error");
            if (error.has("message")) {
                String errorMsg = error.path("message").asText();
                log.error("[GeminiAiProvider] Gemini returned error: {}", errorMsg);
                throw new RuntimeException("Gemini API error: " + errorMsg);
            }
            log.error("[GeminiAiProvider] Invalid response format from Gemini: {}", response.substring(0, Math.min(200, response.length())));
            throw new RuntimeException("Invalid response format from Gemini");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GeminiAiProvider] Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }
}

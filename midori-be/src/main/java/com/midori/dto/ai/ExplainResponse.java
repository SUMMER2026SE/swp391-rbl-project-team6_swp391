package com.midori.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExplainResponse {

    @NotBlank(message = "grammarExplanation must not be blank")
    private String grammarExplanation;

    @NotBlank(message = "wordUsage must not be blank")
    private String wordUsage;

    @NotBlank(message = "nuance must not be blank")
    private String nuance;

    @NotBlank(message = "context must not be blank")
    private String context;

    public static ExplainResponse fromRawResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return ExplainResponse.builder()
                    .grammarExplanation("Xin lỗi, AI chưa tạo được giải thích ngữ pháp.")
                    .wordUsage("Xin lỗi, AI chưa tạo được cách dùng từ.")
                    .nuance("Xin lỗi, AI chưa tạo được gợi ý về sắc thái.")
                    .context("Xin lỗi, AI chưa tạo được gợi ý về ngữ cảnh.")
                    .build();
        }

        String cleaned = rawResponse.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            var node = objectMapper.readTree(cleaned.trim());
            String grammarExplanation = node.path("grammarExplanation").isMissingNode() ? null : node.path("grammarExplanation").asText(null);
            String wordUsage = node.path("wordUsage").isMissingNode() ? null : node.path("wordUsage").asText(null);
            String nuance = node.path("nuance").isMissingNode() ? null : node.path("nuance").asText(null);
            String context = node.path("context").isMissingNode() ? null : node.path("context").asText(null);

            if (grammarExplanation == null || wordUsage == null || nuance == null || context == null) {
                return ExplainResponse.builder()
                        .grammarExplanation(nonBlank(grammarExplanation, "AI chưa trả rõ phần giải thích ngữ pháp."))
                        .wordUsage(nonBlank(wordUsage, "AI chưa trả rõ phần cách dùng từ."))
                        .nuance(nonBlank(nuance, "AI chưa trả rõ phần sắc thái."))
                        .context(nonBlank(context, "AI chưa trả rõ phần ngữ cảnh."))
                        .build();
            }

            return ExplainResponse.builder()
                    .grammarExplanation(grammarExplanation)
                    .wordUsage(wordUsage)
                    .nuance(nuance)
                    .context(context)
                    .build();
        } catch (Exception e) {
            return ExplainResponse.builder()
                    .grammarExplanation(nonBlank(null, "Xin lỗi, AI Sensei chưa đọc được kết quả giải thích."))
                    .wordUsage(nonBlank(null, "Xin lỗi, AI Sensei chưa đọc được kết quả cách dùng từ."))
                    .nuance(nonBlank(null, "Xin lỗi, AI Sensei chưa đọc được kết quả sắc thái."))
                    .context(nonBlank(null, "Xin lỗi, AI Sensei chưa đọc được kết quả ngữ cảnh."))
                    .build();
        }
    }

    private static String nonBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}

package com.midori.dto.ai;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateQuestionsRequest {

    @NotBlank(message = "Topic is required")
    @Size(max = 255, message = "Topic must be at most 255 characters")
    private String topic;

    private String materialId;

    @Size(max = 255, message = "Material title must be at most 255 characters")
    private String materialTitle;

    @Size(max = 12000, message = "Material content must be at most 12000 characters")
    private String materialContent;

    @NotBlank(message = "Level is required")
    @Size(max = 20, message = "Level must be at most 20 characters")
    private String level;

    @NotNull(message = "Count is required")
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 20, message = "Count must be at most 20")
    private Integer count;

    @NotBlank(message = "Question type is required")
    @Pattern(regexp = "^(MULTIPLE_CHOICE|TRUE_FALSE|FILL_BLANK|MIXED)$", message = "Invalid question type")
    private String type;

    public String getNormalizedType() {
        String raw = type;
        if (raw == null) return "MULTIPLE_CHOICE";
        return switch (raw.trim().toUpperCase()) {
            case "TRUE_FALSE", "FILL_BLANK", "MIXED" -> raw.trim().toUpperCase();
            default -> "MULTIPLE_CHOICE";
        };
    }
}

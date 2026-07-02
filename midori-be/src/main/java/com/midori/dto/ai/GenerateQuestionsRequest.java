package com.midori.dto.ai;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateQuestionsRequest {

    @NotBlank(message = "Topic is required")
    @Size(max = 200, message = "Topic must be at most 200 characters")
    private String topic;

    @NotBlank(message = "Level is required")
    @Size(max = 20, message = "Level must be at most 20 characters")
    private String level;

    @NotNull(message = "Count is required")
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 20, message = "Count must be at most 20")
    private Integer count;

    private String type;
}

package com.midori.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIUsageLogRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    private UUID lessonId;

    @NotBlank(message = "Feature is required")
    private String feature;

    @NotBlank(message = "Provider is required")
    private String provider;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Prompt tokens is required")
    @PositiveOrZero(message = "Prompt tokens must be zero or positive")
    private Integer promptTokens;

    @NotNull(message = "Completion tokens is required")
    @PositiveOrZero(message = "Completion tokens must be zero or positive")
    private Integer completionTokens;

    @NotNull(message = "Total tokens is required")
    @PositiveOrZero(message = "Total tokens must be zero or positive")
    private Integer totalTokens;

    @NotNull(message = "Processing time is required")
    @PositiveOrZero(message = "Processing time must be zero or positive")
    private Long processingTime;

    @NotBlank(message = "Status is required")
    private String status;

    private String errorMessage;
}

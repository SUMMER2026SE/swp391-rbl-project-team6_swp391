package com.midori.dto.ai;

import com.midori.entity.AIUsageLog;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIUsageLogResponse {

    private UUID id;
    private UUID userId;
    private UUID lessonId;
    private String feature;
    private String provider;
    private String model;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer totalTokens;
    private Long processingTime;
    private String status;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;

    public static AIUsageLogResponse fromEntity(AIUsageLog log) {
        return AIUsageLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .lessonId(log.getLessonId())
                .feature(log.getFeature())
                .provider(log.getProvider())
                .model(log.getModel())
                .promptTokens(log.getPromptTokens())
                .completionTokens(log.getCompletionTokens())
                .totalTokens(log.getTotalTokens())
                .processingTime(log.getProcessingTime())
                .status(log.getStatus().name())
                .errorMessage(log.getErrorMessage())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }
}

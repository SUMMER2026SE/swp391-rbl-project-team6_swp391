package com.midori.service;

import com.midori.dto.ai.AIUsageLogRequest;
import com.midori.dto.ai.AIUsageLogResponse;

import java.util.List;
import java.util.UUID;

public interface AIUsageLogService {

    AIUsageLogResponse createLog(AIUsageLogRequest request);

    AIUsageLogResponse getLogById(UUID id);

    List<AIUsageLogResponse> getLogsByUserId(UUID userId);

    List<AIUsageLogResponse> getLogsByLessonId(UUID lessonId);

    List<AIUsageLogResponse> getAllLogs();

    void deleteLog(UUID id);

    void logAIUsage(UUID userId, UUID lessonId, String feature, String provider, String model,
                    int promptTokens, int completionTokens, int totalTokens, long processingTime,
                    boolean success, String errorMessage);
}

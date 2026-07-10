package com.midori.service.impl;

import com.midori.dto.ai.AIUsageLogRequest;
import com.midori.dto.ai.AIUsageLogResponse;
import com.midori.entity.AIUsageLog;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.AIUsageLogRepository;
import com.midori.service.AIUsageLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AIUsageLogServiceImpl implements AIUsageLogService {

    private final AIUsageLogRepository aiUsageLogRepository;

    @Override
    public AIUsageLogResponse createLog(AIUsageLogRequest request) {
        AIUsageLog.AIUsageStatus status;
        try {
            status = AIUsageLog.AIUsageStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            status = AIUsageLog.AIUsageStatus.SUCCESS;
        }

        AIUsageLog log = AIUsageLog.builder()
                .userId(request.getUserId())
                .lessonId(request.getLessonId())
                .feature(request.getFeature())
                .provider(request.getProvider())
                .model(request.getModel())
                .promptTokens(request.getPromptTokens())
                .completionTokens(request.getCompletionTokens())
                .totalTokens(request.getTotalTokens())
                .processingTime(request.getProcessingTime())
                .status(status)
                .errorMessage(request.getErrorMessage())
                .build();

        AIUsageLog savedLog = aiUsageLogRepository.save(log);
        return AIUsageLogResponse.fromEntity(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public AIUsageLogResponse getLogById(UUID id) {
        AIUsageLog log = aiUsageLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI Usage Log not found with id: " + id));
        return AIUsageLogResponse.fromEntity(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIUsageLogResponse> getLogsByUserId(UUID userId) {
        return aiUsageLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AIUsageLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIUsageLogResponse> getLogsByLessonId(UUID lessonId) {
        return aiUsageLogRepository.findByLessonIdOrderByCreatedAtDesc(lessonId)
                .stream()
                .map(AIUsageLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIUsageLogResponse> getAllLogs() {
        return aiUsageLogRepository.findAll()
                .stream()
                .map(AIUsageLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteLog(UUID id) {
        if (!aiUsageLogRepository.existsById(id)) {
            throw new ResourceNotFoundException("AI Usage Log not found with id: " + id);
        }
        aiUsageLogRepository.deleteById(id);
    }

    @Override
    public void logAIUsage(UUID userId, UUID lessonId, String feature, String provider, String model,
                           int promptTokens, int completionTokens, int totalTokens, long processingTime,
                           boolean success, String errorMessage) {
        AIUsageLog log = AIUsageLog.builder()
                .userId(userId)
                .lessonId(lessonId)
                .feature(feature)
                .provider(provider)
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .totalTokens(totalTokens)
                .processingTime(processingTime)
                .status(success ? AIUsageLog.AIUsageStatus.SUCCESS : AIUsageLog.AIUsageStatus.FAILED)
                .errorMessage(errorMessage)
                .build();

        aiUsageLogRepository.save(log);
    }
}

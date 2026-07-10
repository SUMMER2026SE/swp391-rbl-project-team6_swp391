package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AIUsageLogRequest;
import com.midori.dto.ai.AIUsageLogResponse;
import com.midori.service.AIUsageLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/ai/logs")
@RequiredArgsConstructor
public class AIUsageLogController {

    private final AIUsageLogService aiUsageLogService;

    @PostMapping
    public ResponseEntity<ApiResponse<AIUsageLogResponse>> createLog(
            @Valid @RequestBody AIUsageLogRequest request) {
        AIUsageLogResponse response = aiUsageLogService.createLog(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AI usage log created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AIUsageLogResponse>>> getAllLogs() {
        List<AIUsageLogResponse> logs = aiUsageLogService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AIUsageLogResponse>> getLogById(@PathVariable UUID id) {
        AIUsageLogResponse log = aiUsageLogService.getLogById(id);
        return ResponseEntity.ok(ApiResponse.success(log));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AIUsageLogResponse>>> getLogsByUserId(
            @PathVariable UUID userId) {
        List<AIUsageLogResponse> logs = aiUsageLogService.getLogsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ApiResponse<List<AIUsageLogResponse>>> getLogsByLessonId(
            @PathVariable UUID lessonId) {
        List<AIUsageLogResponse> logs = aiUsageLogService.getLogsByLessonId(lessonId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLog(@PathVariable UUID id) {
        aiUsageLogService.deleteLog(id);
        return ResponseEntity.ok(ApiResponse.success("AI usage log deleted successfully", null));
    }
}

package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.homeworkdto.ManualHomeworkRequest;
import com.midori.dto.homeworkdto.ManualHomeworkResponse;
import com.midori.dto.homeworkdto.ManualHomeworkQuestionResponse;
import com.midori.entity.ManualHomework;
import com.midori.entity.ManualHomeworkQuestion;
import com.midori.security.CustomUserDetails;
import com.midori.service.ManualHomeworkService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher/manual-homeworks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class ManualHomeworkController {

    private final ManualHomeworkService manualHomeworkService;

    @PostMapping
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> createManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ManualHomeworkRequest request) {
        ManualHomework homework = manualHomeworkService.createManualHomework(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template created successfully", mapToResponse(homework, true)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> updateManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody ManualHomeworkRequest request) {
        ManualHomework homework = manualHomeworkService.updateManualHomework(userDetails.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template updated successfully", mapToResponse(homework, true)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> getManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ManualHomework homework = manualHomeworkService.getManualHomework(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template retrieved successfully", mapToResponse(homework, true)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ManualHomeworkResponse>>> getManualHomeworks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ManualHomework> homeworks = manualHomeworkService.getManualHomeworksByTeacher(userDetails.getId());
        List<ManualHomeworkResponse> responses = homeworks.stream()
                .map(hw -> mapToResponse(hw, false)) // Summarized only
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Manual homework templates retrieved successfully", responses));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        manualHomeworkService.deleteManualHomework(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template deleted successfully", null));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> publishManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody(required = false) AssignClassRequest request) {
        ManualHomework homework;
        if (request != null && request.getClassId() != null && request.getDueDate() != null) {
            homework = manualHomeworkService.publishManualHomework(userDetails.getId(), id, request.getClassId(), request.getDueDate());
        } else {
            homework = manualHomeworkService.publishManualHomework(userDetails.getId(), id);
        }
        return ResponseEntity.ok(ApiResponse.success("Manual homework template published and assigned successfully", mapToResponse(homework, true)));
    }

    @PatchMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> draftManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ManualHomework homework = manualHomeworkService.draftManualHomework(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template moved to draft successfully", mapToResponse(homework, true)));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<ManualHomeworkResponse>> duplicateManualHomework(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        ManualHomework homework = manualHomeworkService.duplicateManualHomework(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Manual homework template duplicated successfully", mapToResponse(homework, true)));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Void>> assignToClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AssignClassRequest request) {
        manualHomeworkService.copyToHomework(id, request.getClassId(), request.getDueDate(), userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Homework template assigned to class successfully", null));
    }

    @Data
    public static class AssignClassRequest {
        private UUID classId;
        private Instant dueDate;
    }

    private ManualHomeworkResponse mapToResponse(ManualHomework hw, boolean includeQuestions) {
        String teacherName = hw.getTeacher().getProfile() != null ? hw.getTeacher().getProfile().getDisplayName() : hw.getTeacher().getEmail();
        if (teacherName == null || teacherName.isBlank()) {
            teacherName = hw.getTeacher().getEmail();
        }

        List<ManualHomeworkQuestionResponse> questions = null;
        if (includeQuestions && hw.getQuestions() != null) {
            questions = hw.getQuestions().stream()
                    .map(this::mapQuestionToResponse)
                    .collect(Collectors.toList());
        }

        return ManualHomeworkResponse.builder()
                .id(hw.getId())
                .title(hw.getTitle())
                .description(hw.getDescription())
                .level(hw.getLevel())
                .type(hw.getType())
                .status(hw.getStatus())
                .duration(hw.getDuration())
                .teacherId(hw.getTeacher().getId())
                .teacherName(teacherName)
                .questionCount(hw.getQuestionCount())
                .version(hw.getVersion())
                .questions(questions)
                .createdAt(hw.getCreatedAt())
                .updatedAt(hw.getUpdatedAt())
                .build();
    }

    private ManualHomeworkQuestionResponse mapQuestionToResponse(ManualHomeworkQuestion q) {
        return ManualHomeworkQuestionResponse.builder()
                .id(q.getId())
                .questionOrder(q.getQuestionOrder())
                .questionType(q.getQuestionType())
                .content(q.getContent())
                .options(q.getOptions())
                .correctAnswer(q.getCorrectAnswer())
                .explanation(q.getExplanation())
                .difficulty(q.getDifficulty())
                .points(q.getPoints())
                .skill(q.getSkill())
                .imageUrl(q.getImageUrl())
                .build();
    }
}

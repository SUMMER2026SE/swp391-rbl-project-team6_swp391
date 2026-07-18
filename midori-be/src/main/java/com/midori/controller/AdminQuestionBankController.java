package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.entity.QuestionBankLesson;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.QuestionBankLessonService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only endpoints for managing Question Bank Lessons.
 *
 * Returns lessons for all statuses (Active, Draft, Archived, Inactive)
 * so administrators can manage the full lifecycle of a lesson.
 */
@RestController
@RequestMapping("/api/admin/question-bank/lessons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionBankController {

    private final QuestionBankLessonService questionBankLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionBankLesson>>> getLessons(@RequestParam String level) {
        return ResponseEntity.ok(ApiResponse.success(questionBankLessonService.findLessonsByLevel(level)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankLesson>> getLesson(@PathVariable Integer id) {
        QuestionBankLesson lesson = questionBankLessonService.findLessonById(id);
        return ResponseEntity.ok(ApiResponse.success(lesson));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionBankLesson>> createLesson(@Valid @RequestBody CreateLessonPayload payload) {
        QuestionBankLesson lesson = QuestionBankLesson.builder()
                .level(payload.level() == null ? null : payload.level().toUpperCase())
                .lessonNumber(payload.lessonNumber())
                .lessonName(payload.lessonName())
                .status(payload.status() == null ? "ACTIVE" : payload.status().toUpperCase())
                .build();
        QuestionBankLesson created = questionBankLessonService.createLesson(lesson);
        return ResponseEntity.ok(ApiResponse.success("Lesson created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankLesson>> updateLesson(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateLessonPayload payload) {
        QuestionBankLesson updated = questionBankLessonService.updateLesson(
                id,
                payload.lessonName(),
                payload.lessonNumber(),
                payload.status()
        );
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable Integer id) {
        if (questionBankLessonService.findLessonById(id) == null) {
            throw new ResourceNotFoundException("QuestionBankLesson", "id", id);
        }
        questionBankLessonService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted successfully", null));
    }

    public record CreateLessonPayload(
            String level,
            @NotNull @Positive Integer lessonNumber,
            @NotBlank String lessonName,
            String status
    ) {}

    public record UpdateLessonPayload(
            String lessonName,
            @Positive Integer lessonNumber,
            String status
    ) {}
}


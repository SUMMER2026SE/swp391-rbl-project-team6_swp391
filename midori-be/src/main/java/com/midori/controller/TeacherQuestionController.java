package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.questiondto.CreateTeacherQuestionRequest;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import com.midori.dto.questiondto.UpdateTeacherQuestionRequest;
import com.midori.entity.TeacherQuestion;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.service.TeacherQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/questions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherQuestionController {

    private final TeacherQuestionService teacherQuestionService;
    private final UserRepository userRepository;
    private final com.midori.repository.TeacherQuestionRepository teacherQuestionRepository;
    private final com.midori.repository.QuestionBankLessonRepository questionBankLessonRepository;
    private final com.midori.service.QuestionBankLessonService questionBankLessonService;

    private boolean isAdmin(CustomUserDetails userDetails) {
        if (userDetails == null) return false;
        return userRepository.findById(userDetails.getId())
                .map(u -> u.getRole() == com.midori.entity.Role.ADMIN)
                .orElse(false);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> createQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateTeacherQuestionRequest request) {
        User teacher = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));

        com.midori.entity.QuestionBankLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = questionBankLessonRepository.findById(request.getLessonId()).orElse(null);
        }

        TeacherQuestion question = TeacherQuestion.builder()
                .teacher(teacher)
                .topicId(request.getTopicId())
                .level(request.getLevel())
                .skill(request.getSkill())
                .lesson(lesson)
                .source(request.getSource() != null ? request.getSource() : "HOMEWORK")
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions())
                .status(com.midori.entity.UserStatus.ACTIVE.name())
                .audioUrl(request.getAudioUrl())
                .audioFileName(request.getAudioFileName())
                .audioDuration(request.getAudioDuration())
                .build();

        TeacherQuestion saved = teacherQuestionService.createQuestion(question);
        return ResponseEntity.ok(ApiResponse.success("Question created successfully", mapToResponse(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> updateQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeacherQuestionRequest request) {
        
        com.midori.entity.QuestionBankLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = questionBankLessonRepository.findById(request.getLessonId()).orElse(null);
        }

        TeacherQuestion details = TeacherQuestion.builder()
                .topicId(request.getTopicId())
                .level(request.getLevel())
                .skill(request.getSkill())
                .lesson(lesson)
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : com.midori.entity.UserStatus.ACTIVE.name())
                .audioUrl(request.getAudioUrl())
                .audioFileName(request.getAudioFileName())
                .audioDuration(request.getAudioDuration())
                .build();

        TeacherQuestion updated = teacherQuestionService.updateQuestion(id, details, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", mapToResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        teacherQuestionService.deleteQuestion(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherQuestionResponse>>> getQuestions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TeacherQuestion> questions = isAdmin(userDetails)
                ? teacherQuestionRepository.findAll()
                : teacherQuestionService.findQuestionsForTeacherView(userDetails.getId());
        
        java.util.Map<String, TeacherQuestion> uniqueMap = new java.util.LinkedHashMap<>();
        java.util.List<TeacherQuestion> duplicatesToDelete = new java.util.ArrayList<>();
        
        for (TeacherQuestion q : questions) {
            String key = q.getPrompt() != null ? q.getPrompt().trim() : "";
            if (!uniqueMap.containsKey(key)) {
                uniqueMap.put(key, q);
            } else {
                duplicatesToDelete.add(q);
            }
        }
        
        if (!duplicatesToDelete.isEmpty()) {
            try {
                teacherQuestionRepository.deleteAll(duplicatesToDelete);
            } catch (Exception e) {
                // Ignore silent delete errors
            }
        }
        
        List<TeacherQuestionResponse> responses = uniqueMap.values().stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> getQuestionById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        TeacherQuestion question = teacherQuestionService.findQuestionById(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(question)));
    }

    // ─── Lesson Centralized CRUD Routes (Admin only for writes) ─────────────────

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<com.midori.entity.QuestionBankLesson>>> getLessons(
            @RequestParam String level,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<com.midori.entity.QuestionBankLesson> lessons = isAdmin(userDetails)
                ? questionBankLessonService.findLessonsByLevel(level)
                : questionBankLessonService.findActiveLessonsByLevel(level);
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @PostMapping("/lessons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.midori.entity.QuestionBankLesson>> createLesson(
            @Valid @RequestBody com.midori.entity.QuestionBankLesson lesson) {
        com.midori.entity.QuestionBankLesson saved = questionBankLessonService.createLesson(lesson);
        return ResponseEntity.ok(ApiResponse.success("Lesson created successfully", saved));
    }

    @PutMapping("/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.midori.entity.QuestionBankLesson>> updateLesson(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Object> body) {
        String name = (String) body.get("lessonName");
        Integer number = body.get("lessonNumber") != null ? ((Number) body.get("lessonNumber")).intValue() : null;
        String status = (String) body.get("status");
        com.midori.entity.QuestionBankLesson updated = questionBankLessonService.updateLesson(id, name, number, status);
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", updated));
    }

    @DeleteMapping("/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable Integer id) {
        questionBankLessonService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted successfully", null));
    }

    private TeacherQuestionResponse mapToResponse(TeacherQuestion question) {
        if (question == null) return null;
        return TeacherQuestionResponse.builder()
                .id(question.getId())
                .teacherId(question.getTeacher().getId())
                .topicId(question.getTopicId())
                .level(question.getLevel())
                .skill(question.getSkill())
                .lessonId(question.getLesson() != null ? question.getLesson().getId() : null)
                .source(question.getSource())
                .prompt(question.getPrompt())
                .jpPrompt(question.getJpPrompt())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .explanation(question.getExplanation())
                .tags(question.getTags())
                .status(question.getStatus())
                .points(question.getPoints())
                .options(question.getOptions())
                .audioUrl(question.getAudioUrl())
                .audioFileName(question.getAudioFileName())
                .audioDuration(question.getAudioDuration())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }
}

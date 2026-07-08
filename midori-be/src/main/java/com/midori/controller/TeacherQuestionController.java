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
@PreAuthorize("hasRole('TEACHER')")
public class TeacherQuestionController {

    private final TeacherQuestionService teacherQuestionService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> createQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateTeacherQuestionRequest request) {
        User teacher = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));

        TeacherQuestion question = TeacherQuestion.builder()
                .teacher(teacher)
                .topicId(request.getTopicId())
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions())
                .status("ACTIVE")
                .build();

        TeacherQuestion saved = teacherQuestionService.createQuestion(question);
        return ResponseEntity.ok(ApiResponse.success("Question created successfully", mapToResponse(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> updateQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeacherQuestionRequest request) {
        TeacherQuestion details = TeacherQuestion.builder()
                .topicId(request.getTopicId())
                .prompt(request.getPrompt())
                .jpPrompt(request.getJpPrompt())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "MEDIUM")
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .explanation(request.getExplanation())
                .tags(request.getTags())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .options(request.getOptions())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .build();

        TeacherQuestion updated = teacherQuestionService.updateQuestion(id, details, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", mapToResponse(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        teacherQuestionService.deleteQuestion(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherQuestionResponse>>> getQuestions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TeacherQuestion> questions = teacherQuestionService.findQuestionsByTeacher(userDetails.getId());
        List<TeacherQuestionResponse> responses = questions.stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherQuestionResponse>> getQuestionById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        TeacherQuestion question = teacherQuestionService.findQuestionById(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(question)));
    }

    private TeacherQuestionResponse mapToResponse(TeacherQuestion question) {
        if (question == null) return null;
        return TeacherQuestionResponse.builder()
                .id(question.getId())
                .teacherId(question.getTeacher().getId())
                .topicId(question.getTopicId())
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
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }
}

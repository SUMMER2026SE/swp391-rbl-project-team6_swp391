package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.questiondto.QuestionBankTopicResponse;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
import com.midori.dto.questiondto.GeneratePreviewRequest;
import com.midori.dto.questiondto.TeacherQuestionResponse;
import com.midori.service.QuestionBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-bank")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    @GetMapping("/levels")
    public ResponseEntity<ApiResponse<List<String>>> getLevels() {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getLevels()));
    }

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<String>>> getSkills() {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getSkills()));
    }

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<com.midori.dto.questiondto.QuestionBankGeneratorLessonResponse>>> getLessons(
            @RequestParam String level,
            @RequestParam List<String> skills) {
        // Defensive: if the client sent a single comma-separated string, split it
        List<String> normalizedSkills = skills.stream()
                .flatMap(s -> java.util.Arrays.stream(s.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getLessons(level, normalizedSkills)));
    }

    @GetMapping("/levels/{level}/lessons")
    public ResponseEntity<ApiResponse<List<com.midori.entity.QuestionBankLesson>>> getLessonsByLevel(
            @PathVariable String level) {
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getLessonsByLevel(level)));
    }

    @PostMapping("/randomize")
    public ResponseEntity<ApiResponse<List<com.midori.dto.questiondto.TeacherQuestionPreviewDto>>> randomizeQuestions(
            @Valid @RequestBody RandomizeQuestionsRequest request) {
        List<com.midori.dto.questiondto.TeacherQuestionPreviewDto> randomized = questionBankService.randomizeQuestions(request);
        return ResponseEntity.ok(ApiResponse.success("Questions randomized successfully", randomized));
    }

    @PostMapping("/generate-preview")
    public ResponseEntity<ApiResponse<List<com.midori.dto.questiondto.TeacherQuestionPreviewDto>>> generatePreview(
            @Valid @RequestBody GeneratePreviewRequest request) {
        List<com.midori.dto.questiondto.TeacherQuestionPreviewDto> preview = questionBankService.generatePreview(request);
        return ResponseEntity.ok(ApiResponse.success("Preview generated successfully", preview));
    }
}

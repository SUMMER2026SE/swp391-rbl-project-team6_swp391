package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.questiondto.QuestionBankTopicResponse;
import com.midori.dto.questiondto.RandomizeQuestionsRequest;
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
        return ResponseEntity.ok(ApiResponse.success(questionBankService.getLessons(level, skills)));
    }

    @PostMapping("/randomize")
    public ResponseEntity<ApiResponse<List<TeacherQuestionResponse>>> randomizeQuestions(
            @Valid @RequestBody RandomizeQuestionsRequest request) {
        List<TeacherQuestionResponse> randomized = questionBankService.randomizeQuestions(request);
        return ResponseEntity.ok(ApiResponse.success("Questions randomized successfully", randomized));
    }
}

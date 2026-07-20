package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.request.AiExamGenerateRequest;
import com.midori.dto.request.GenerateExamFromQuestionBankRequest;
import com.midori.dto.response.ExamResponse;
import com.midori.service.ExamGenerationService;
import com.midori.service.TeacherExamAiService;
import com.midori.ai.dto.AiExamParseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherExamController {

    private final ExamGenerationService examGenerationService;
    private final TeacherExamAiService teacherExamAiService;

    @PostMapping("/ai-generate")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AiExamParseResponse>> generateAiExam(
            @Valid @RequestBody AiExamGenerateRequest request) {
        AiExamParseResponse response = teacherExamAiService.generateExamQuestions(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/generate-from-question-bank")
    public ResponseEntity<ApiResponse<ExamResponse>> generateExamFromQuestionBank(
            @Valid @RequestBody GenerateExamFromQuestionBankRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse exam = examGenerationService.generateExamFromQuestionBank(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam generated successfully", exam));
    }

    @PostMapping("/preview-generation")
    public ResponseEntity<ApiResponse<java.util.List<com.midori.dto.questiondto.TeacherQuestionResponse>>> previewGeneration(
            @Valid @RequestBody com.midori.dto.request.PreviewGenerationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        java.util.List<com.midori.dto.questiondto.TeacherQuestionResponse> preview = examGenerationService.previewGeneration(request, userDetails);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @GetMapping("/questions-stats")
    public ResponseEntity<ApiResponse<java.util.Map<String, java.util.Map<String, Integer>>>> getQuestionStats(
            @RequestParam String level,
            @RequestParam String source,
            @AuthenticationPrincipal UserDetails userDetails) {
        java.util.Map<String, java.util.Map<String, Integer>> stats = examGenerationService.getQuestionStats(level, source, userDetails);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<com.midori.entity.SkillType[]>> getSkills() {
        return ResponseEntity.ok(ApiResponse.success(com.midori.entity.SkillType.values()));
    }
}

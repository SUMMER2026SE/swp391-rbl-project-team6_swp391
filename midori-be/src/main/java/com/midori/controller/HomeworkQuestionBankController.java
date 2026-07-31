package com.midori.controller;

import com.midori.common.ApiResponse;
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
@RequestMapping("/api/homework/question-bank")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class HomeworkQuestionBankController {

    private final QuestionBankService questionBankService;

    @PostMapping("/generate-preview")
    public ResponseEntity<ApiResponse<List<com.midori.dto.questiondto.TeacherQuestionPreviewDto>>> generatePreview(
            @Valid @RequestBody GeneratePreviewRequest request) {
        List<com.midori.dto.questiondto.TeacherQuestionPreviewDto> preview = questionBankService.generatePreview(request);
        return ResponseEntity.ok(ApiResponse.success("Preview generated successfully", preview));
    }
}

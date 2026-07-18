package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.questiondto.AssignExamFromBankRequest;
import com.midori.dto.questiondto.AssignFromBankResponse;
import com.midori.dto.questiondto.AssignHomeworkFromBankRequest;
import com.midori.security.CustomUserDetails;
import com.midori.service.QuestionBankAssignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/question-bank")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class QuestionBankAssignController {

    private final QuestionBankAssignService questionBankAssignService;

    @PostMapping("/topics/{topicId}/assign-homework")
    public ResponseEntity<ApiResponse<AssignFromBankResponse>> assignHomework(
            @PathVariable String topicId,
            @Valid @RequestBody AssignHomeworkFromBankRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        int created = questionBankAssignService.assignHomeworkFromBank(
                topicId, request, userDetails.getId());

        return ResponseEntity.ok(ApiResponse.success(
                "Homework assigned to " + created + (created == 1 ? " class." : " classes."),
                new AssignFromBankResponse(created)));
    }

    @PostMapping("/topics/{topicId}/assign-exam")
    public ResponseEntity<ApiResponse<AssignFromBankResponse>> assignExam(
            @PathVariable String topicId,
            @Valid @RequestBody AssignExamFromBankRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        int created = questionBankAssignService.assignExamFromBank(
                topicId, request, userDetails.getId());

        return ResponseEntity.ok(ApiResponse.success(
                "Exam assigned to " + created + (created == 1 ? " class." : " classes."),
                new AssignFromBankResponse(created)));
    }
}

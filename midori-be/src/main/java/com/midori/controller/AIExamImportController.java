package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.AiImportJobResponse;
import com.midori.entity.User;
import com.midori.repository.UserRepository;
import com.midori.service.AiExamImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiExamImportController {

    private final AiExamImportService aiExamImportService;
    private final UserRepository userRepository;

    @PostMapping(value = "/exams/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AiImportJobResponse>> importExamFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("classId") String classId,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "status", required = false) String status,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI import request: file={}, classId={}, level={}, user={}",
                file.getOriginalFilename(), classId, level,
                userDetails != null ? userDetails.getUsername() : "anonymous");

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("PDF file is required"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only PDF files are accepted"));
        }

        AiExamImportService.ImportInitResult init =
                aiExamImportService.initImportJob(file, classId, userDetails);

        UUID userId = userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow();

        aiExamImportService.processImportAsync(init.jobId(), file, classId, level, status);

        AiImportJobResponse jobInfo = AiImportJobResponse.builder()
                .jobId(init.jobId())
                .status("PENDING")
                .message("PDF uploaded. Processing started asynchronously.")
                .build();

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("PDF upload accepted. Exam import is processing.", jobInfo));
    }

    @GetMapping("/exams/import/{jobId}")
    public ResponseEntity<ApiResponse<AiImportJobResponse>> getImportStatus(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow();

        AiImportJobResponse result = aiExamImportService.getJobStatus(jobId, userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}

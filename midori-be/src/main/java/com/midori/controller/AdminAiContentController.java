package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.contentlibrary.AdminAiContentGenerateRequest;
import com.midori.dto.contentlibrary.AdminAiContentGenerateResponse;
import com.midori.service.AdminAiContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

/**
 * REST controller for AI-powered content generation in the Admin Content Library.
 * 
 * Provides endpoints for generating vocabulary, grammar, and reading lessons
 * using AI assistance with optional reference document support.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/content-library/ai")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiContentController {

    private final AdminAiContentService adminAiContentService;

    /**
     * Generate AI content with optional reference document.
     * 
     * The reference document (PDF, DOCX, or TXT) is extracted and its text
     * is used as additional context for generating more relevant content.
     * 
     * Supported file types: PDF, DOCX, TXT
     * Maximum file size: 10MB
     * 
     * @param request the generation request containing lesson details and content parameters
     * @param file optional reference document file (PDF, DOCX, or TXT)
     * @return the generated AI content draft
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<AdminAiContentGenerateResponse>> generateContent(
            @RequestPart(value = "request") @Valid AdminAiContentGenerateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        
        if (request == null) {
            log.warn("Request part not provided");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Request body is required"));
        }
        
        log.info("AI content generation: skillType={}, level={}, lessonNumber={}, hasFile={}", 
                request.getSkillType(), request.getLevel(), request.getLessonNumber(),
                file != null && !file.isEmpty());
        
        AdminAiContentGenerateResponse response;
        
        if (file != null && !file.isEmpty()) {
            response = adminAiContentService.generateContent(request, file);
        } else {
            response = adminAiContentService.generateContent(request);
        }
        
        return ResponseEntity.ok(ApiResponse.success("AI content draft generated successfully", response));
    }
}

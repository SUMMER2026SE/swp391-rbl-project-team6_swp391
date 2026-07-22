package com.midori.service;

import com.midori.dto.contentlibrary.AdminAiContentGenerateRequest;
import com.midori.dto.contentlibrary.AdminAiContentGenerateResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for AI-powered content generation in the Admin Content Library.
 */
public interface AdminAiContentService {
    
    /**
     * Generate AI content without a reference document.
     * 
     * @param request the generation request with lesson details and content parameters
     * @return the generated content draft
     */
    AdminAiContentGenerateResponse generateContent(AdminAiContentGenerateRequest request);
    
    /**
     * Generate AI content with an optional reference document.
     * 
     * The reference document (PDF, DOCX, or TXT) is extracted and its text
     * is included in the AI prompt to provide additional context for generation.
     * 
     * @param request the generation request with lesson details and content parameters
     * @param referenceDocument optional reference document for context (PDF, DOCX, TXT)
     * @return the generated content draft
     */
    AdminAiContentGenerateResponse generateContent(AdminAiContentGenerateRequest request, MultipartFile referenceDocument);
}

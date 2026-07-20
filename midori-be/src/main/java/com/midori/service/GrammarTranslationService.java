package com.midori.service;

import com.midori.dto.grammar.GrammarPatternDetailResponse;

import java.util.UUID;

/**
 * Handles lazy Gemini AI translation for grammar patterns.
 * <p>
 * Flow:
 * 1. Check Redis cache (grammar:vi:{id}) → return immediately on hit
 * 2. If miss → load DB; if meaningVi exists → cache + return
 * 3. If meaningVi null → call Gemini → parse JSON → save DB → cache → return
 * 4. On Gemini failure → return English with translationPending=true, set status=FAILED
 */
public interface GrammarTranslationService {

    /**
     * Returns the full grammar pattern detail, translating to Vietnamese if needed.
     * Vietnamese translation is saved permanently to DB and cached in Redis.
     *
     * @param grammarPatternId the grammar pattern UUID
     * @param videoId          optional — used to load video-specific example sentence
     * @return full detail response with Vietnamese if available
     */
    GrammarPatternDetailResponse translateIfNeeded(UUID grammarPatternId, UUID videoId);
}

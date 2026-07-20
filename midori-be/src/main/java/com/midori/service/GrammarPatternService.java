package com.midori.service;

import com.midori.dto.grammar.GrammarPatternDetailResponse;
import com.midori.dto.grammar.GrammarPatternSummaryResponse;

import java.util.List;
import java.util.UUID;

/**
 * Student-facing grammar pattern service.
 */
public interface GrammarPatternService {

    /**
     * Returns all grammar patterns detected in a shadowing video.
     */
    List<GrammarPatternSummaryResponse> getForVideo(UUID videoId);

    /**
     * Returns full detail for a grammar pattern, triggering lazy Gemini translation if needed.
     *
     * @param grammarPatternId the grammar pattern UUID
     * @param videoId          optional — loads video-specific example sentence
     */
    GrammarPatternDetailResponse getDetailWithTranslation(UUID grammarPatternId, UUID videoId);
}

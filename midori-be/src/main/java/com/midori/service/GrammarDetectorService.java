package com.midori.service;

import com.midori.entity.ShadowingTranscript;

import java.util.List;
import java.util.UUID;

/**
 * Scans video transcripts for known grammar patterns and saves the matches
 * into the video_grammar_patterns join table.
 * <p>
 * Called asynchronously after transcripts are saved — never blocks the main pipeline.
 */
public interface GrammarDetectorService {

    /**
     * Detect grammar patterns in the given transcripts and persist the matches.
     *
     * @param videoId     the shadowing video UUID
     * @param transcripts list of transcripts for this video
     */
    void detectGrammar(UUID videoId, List<ShadowingTranscript> transcripts);

    /**
     * Re-run grammar detection for an existing video using its stored transcripts.
     *
     * @param videoId the shadowing video UUID
     */
    void detectForVideo(UUID videoId);
}

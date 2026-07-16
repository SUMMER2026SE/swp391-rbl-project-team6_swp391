package com.midori.service.impl;

import com.midori.entity.*;
import com.midori.repository.GrammarPatternRepository;
import com.midori.repository.VideoGrammarPatternRepository;
import com.midori.service.GrammarDetectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Detects JLPT grammar patterns in shadowing video transcripts.
 * <p>
 * Strategy:
 * 1. All grammar patterns are loaded into a fast in-memory map on startup.
 * 2. For each transcript sentence, every pattern key is tested for containment.
 * 3. Matches are saved to video_grammar_patterns (deduped per video).
 * <p>
 * Detection is intentionally async and never blocks the main AI pipeline.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GrammarDetectorServiceImpl implements GrammarDetectorService {

    private final GrammarPatternRepository grammarPatternRepository;
    private final VideoGrammarPatternRepository videoGrammarPatternRepository;

    /**
     * In-memory lookup: normalised search key → GrammarPattern entity.
     * Populated on startup and refreshed on demand.
     */
    private final Map<String, GrammarPattern> patternIndex = new ConcurrentHashMap<>();

    @PostConstruct
    public void buildPatternIndex() {
        refreshIndex();
    }

    private void refreshIndex() {
        patternIndex.clear();
        List<GrammarPattern> all = grammarPatternRepository.findAll();
        for (GrammarPattern gp : all) {
            String key = normalizePattern(gp.getPattern());
            if (key != null && !key.isBlank()) {
                patternIndex.put(key, gp);
            }
        }
        log.info("[GrammarDetector] Pattern index built with {} entries.", patternIndex.size());
    }

    @Override
    @Async
    @Transactional
    public void detectGrammar(UUID videoId, List<ShadowingTranscript> transcripts) {
        if (transcripts == null || transcripts.isEmpty()) {
            log.debug("[GrammarDetector] No transcripts for videoId={}", videoId);
            return;
        }

        // Refresh index if it's empty (e.g. import ran after startup)
        if (patternIndex.isEmpty()) {
            refreshIndex();
        }

        if (patternIndex.isEmpty()) {
            log.warn("[GrammarDetector] Pattern index is empty — grammar import may not have run yet.");
            return;
        }

        log.info("[GrammarDetector] Scanning {} sentences for videoId={}", transcripts.size(), videoId);

        // Track which patterns are already saved for this video (avoid duplicate inserts)
        Set<UUID> savedPatternIds = new HashSet<>();

        int matchCount = 0;

        for (ShadowingTranscript transcript : transcripts) {
            String sentence = transcript.getJpText();
            if (sentence == null || sentence.isBlank()) continue;

            for (Map.Entry<String, GrammarPattern> entry : patternIndex.entrySet()) {
                GrammarPattern gp = entry.getValue();

                if (savedPatternIds.contains(gp.getId())) {
                    continue; // Already saved for this video
                }

                if (containsPattern(sentence, gp.getPattern())) {
                    // Check DB as well to be safe (in case of restart mid-process)
                    if (!videoGrammarPatternRepository
                            .existsByIdVideoIdAndIdGrammarPatternId(videoId, gp.getId())) {

                        VideoGrammarPattern vgp = VideoGrammarPattern.builder()
                                .id(new VideoGrammarPatternId(videoId, gp.getId()))
                                .video(transcript.getShadowingVideo())
                                .grammarPattern(gp)
                                .exampleSentence(sentence)
                                .build();
                        videoGrammarPatternRepository.save(vgp);
                        matchCount++;
                    }
                    savedPatternIds.add(gp.getId());
                }
            }
        }

        log.info("[GrammarDetector] videoId={} → {} grammar patterns detected.", videoId, matchCount);
    }

    /**
     * Checks if a transcript sentence contains the grammar pattern.
     * Strips the ～ prefix marker and leading/trailing spaces before matching.
     */
    private boolean containsPattern(String sentence, String rawPattern) {
        if (rawPattern == null || sentence == null) return false;
        String key = normalizePattern(rawPattern);
        if (key == null || key.isBlank()) return false;
        return sentence.contains(key);
    }

    /**
     * Normalizes a pattern for matching:
     * - strips "～" prefix marker (波ダッシュ and full-width tilde)
     * - strips surrounding spaces
     * - takes only the core part before any space or description
     */
    private String normalizePattern(String raw) {
        if (raw == null) return null;
        // Remove ～ and similar markers at the beginning
        String key = raw.replaceAll("^[～〜~＋]+", "").trim();
        // If contains space, take only the first token (the core grammar piece)
        int spaceIdx = key.indexOf(' ');
        if (spaceIdx > 2) {
            key = key.substring(0, spaceIdx).trim();
        }
        return key.isBlank() ? null : key;
    }
}

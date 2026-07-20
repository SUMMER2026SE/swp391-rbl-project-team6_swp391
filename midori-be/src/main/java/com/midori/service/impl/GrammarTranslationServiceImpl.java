package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.grammar.GrammarPatternDetailResponse;
import com.midori.entity.GrammarPattern;
import com.midori.entity.GrammarPatternStatus;
import com.midori.entity.VideoGrammarPattern;
import com.midori.entity.VideoGrammarPatternId;
import com.midori.repository.GrammarPatternRepository;
import com.midori.repository.VideoGrammarPatternRepository;
import com.midori.service.GrammarTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Lazy translation service for grammar patterns.
 * <p>
 * Cache hierarchy: Redis → PostgreSQL → Gemini AI (one-time only).
 * After successful translation, result is saved to DB and Redis.
 * Gemini is NEVER called twice for the same pattern.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GrammarTranslationServiceImpl implements GrammarTranslationService {

    private static final String CACHE_KEY_PREFIX = "grammar:vi:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    private static final String SYSTEM_PROMPT =
            "You are a Japanese grammar expert. Return ONLY valid JSON with no markdown, no explanation. " +
            "Output exactly this structure: {\"meaning_vi\":\"\",\"description_vi\":\"\",\"example_vi\":\"\"}";

    private final GrammarPatternRepository grammarPatternRepository;
    private final VideoGrammarPatternRepository videoGrammarPatternRepository;
    private final AiCoreService aiCoreService;        // REUSED — no new AI wiring
    private final RedisTemplate<String, Object> redisTemplate; // REUSED — existing Redis config
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public GrammarPatternDetailResponse translateIfNeeded(UUID grammarPatternId, UUID videoId) {
        String cacheKey = CACHE_KEY_PREFIX + grammarPatternId;

        // ── 1. Redis cache hit ─────────────────────────────────────────────────
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("[GrammarTranslation] Cache hit for grammarId={}", grammarPatternId);
                GrammarPatternDetailResponse resp =
                        objectMapper.convertValue(cached, GrammarPatternDetailResponse.class);
                injectVideoExample(resp, grammarPatternId, videoId);
                return resp;
            }
        } catch (Exception e) {
            log.warn("[GrammarTranslation] Redis read error for grammarId={}: {}", grammarPatternId, e.getMessage());
        }

        // ── 2. Load from DB ────────────────────────────────────────────────────
        GrammarPattern gp = grammarPatternRepository.findById(grammarPatternId)
                .orElseThrow(() -> new RuntimeException("Grammar pattern not found: " + grammarPatternId));

        // Find video-specific example sentence
        String videoExampleSentence = resolveVideoExampleSentence(grammarPatternId, videoId);

        // ── 3. Vietnamese already in DB ───────────────────────────────────────
        if (gp.getMeaningVi() != null && !gp.getMeaningVi().isBlank()) {
            log.debug("[GrammarTranslation] DB hit (already translated) for grammarId={}", grammarPatternId);
            GrammarPatternDetailResponse response = toDetailResponse(gp, videoExampleSentence, false);
            cacheResponse(cacheKey, response);
            return response;
        }

        // ── 4. Translate with Gemini (one-time) ───────────────────────────────
        log.info("[GrammarTranslation] Translating grammarId={} pattern='{}' via Gemini...",
                grammarPatternId, gp.getPattern());

        try {
            String userMessage = buildTranslationPrompt(gp);
            String aiResponse = aiCoreService.chat(SYSTEM_PROMPT, userMessage, Collections.emptyList());

            // Parse strict JSON response
            String cleanedResponse = stripMarkdown(aiResponse);
            JsonNode json = objectMapper.readTree(cleanedResponse);

            String meaningVi    = getJsonText(json, "meaning_vi");
            String descriptionVi = getJsonText(json, "description_vi");
            String exampleVi    = getJsonText(json, "example_vi");

            // Save permanently to DB
            gp.setMeaningVi(meaningVi);
            gp.setDescriptionVi(descriptionVi);
            gp.setExampleVietnamese(exampleVi);
            gp.setStatus(GrammarPatternStatus.TRANSLATED);
            gp.setTranslatedAt(Instant.now());
            grammarPatternRepository.save(gp);

            log.info("[GrammarTranslation] Successfully translated grammarId={}", grammarPatternId);

            GrammarPatternDetailResponse response = toDetailResponse(gp, videoExampleSentence, false);
            cacheResponse(cacheKey, response);
            return response;

        } catch (Exception e) {
            log.error("[GrammarTranslation] Gemini failed for grammarId={}: {}", grammarPatternId, e.getMessage());

            // Mark as FAILED — will retry on next request
            if (gp.getStatus() != GrammarPatternStatus.TRANSLATED) {
                gp.setStatus(GrammarPatternStatus.FAILED);
                grammarPatternRepository.save(gp);
            }

            // Return English with translationPending=true
            return toDetailResponse(gp, videoExampleSentence, true);
        }
    }

    // ── Helper methods ─────────────────────────────────────────────────────────

    private String resolveVideoExampleSentence(UUID grammarPatternId, UUID videoId) {
        if (videoId == null) return null;
        return videoGrammarPatternRepository
                .findById(new VideoGrammarPatternId(videoId, grammarPatternId))
                .map(VideoGrammarPattern::getExampleSentence)
                .orElse(null);
    }

    private void injectVideoExample(GrammarPatternDetailResponse resp, UUID grammarPatternId, UUID videoId) {
        if (videoId == null || resp.getVideoExampleSentence() != null) return;
        String sentence = resolveVideoExampleSentence(grammarPatternId, videoId);
        if (sentence != null) resp.setVideoExampleSentence(sentence);
    }

    private void cacheResponse(String cacheKey, GrammarPatternDetailResponse response) {
        try {
            redisTemplate.opsForValue().set(cacheKey, response, CACHE_TTL);
        } catch (Exception e) {
            log.warn("[GrammarTranslation] Redis write error for key {}: {}", cacheKey, e.getMessage());
        }
    }

    private String buildTranslationPrompt(GrammarPattern gp) {
        return String.format(
                "Translate this Japanese grammar pattern to Vietnamese:\n" +
                "Pattern: %s\n" +
                "JLPT Level: %s\n" +
                "Meaning (English): %s\n" +
                "Description (English): %s\n" +
                "Example Japanese: %s\n" +
                "Example English: %s\n\n" +
                "Return JSON: {\"meaning_vi\":\"\",\"description_vi\":\"\",\"example_vi\":\"\"}",
                gp.getPattern(),
                gp.getJlptLevel(),
                gp.getMeaningEn(),
                gp.getDescriptionEn(),
                gp.getExampleJapanese(),
                gp.getExampleEnglish()
        );
    }

    private GrammarPatternDetailResponse toDetailResponse(GrammarPattern gp,
                                                           String videoExampleSentence,
                                                           boolean translationPending) {
        return GrammarPatternDetailResponse.builder()
                .id(gp.getId())
                .pattern(gp.getPattern())
                .jlptLevel(gp.getJlptLevel())
                .meaningEn(gp.getMeaningEn())
                .meaningVi(gp.getMeaningVi())
                .descriptionEn(gp.getDescriptionEn())
                .descriptionVi(gp.getDescriptionVi())
                .structure(gp.getStructure())
                .exampleJapanese(gp.getExampleJapanese())
                .exampleEnglish(gp.getExampleEnglish())
                .exampleVietnamese(gp.getExampleVietnamese())
                .videoExampleSentence(videoExampleSentence)
                .note(gp.getNote())
                .status(gp.getStatus() != null ? gp.getStatus().name() : null)
                .translatedAt(gp.getTranslatedAt())
                .translationPending(translationPending)
                .build();
    }

    private String stripMarkdown(String raw) {
        if (raw == null) return "{}";
        return raw.replaceAll("```json", "").replaceAll("```", "").trim();
    }

    private String getJsonText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode val = node.get(field);
        return (val != null && !val.isNull()) ? val.asText().trim() : null;
    }
}

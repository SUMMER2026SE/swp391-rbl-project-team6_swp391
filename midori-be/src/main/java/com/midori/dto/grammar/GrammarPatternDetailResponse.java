package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Full grammar pattern detail — returned after lazy Gemini translation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarPatternDetailResponse {

    private UUID id;
    private String pattern;
    private String jlptLevel;

    // ── English (always present) ───────────────────────────────────────────────
    private String meaningEn;
    private String descriptionEn;

    // ── Vietnamese (null until Gemini translates — then permanently saved) ─────
    private String meaningVi;
    private String descriptionVi;

    // ── Structure & Examples ──────────────────────────────────────────────────
    private String structure;
    private String exampleJapanese;
    private String exampleEnglish;
    private String exampleVietnamese;

    /** Actual sentence from video transcript that triggered the match. */
    private String videoExampleSentence;

    private String note;

    // ── Metadata ──────────────────────────────────────────────────────────────
    private String status;
    private Instant translatedAt;

    /**
     * true when Gemini failed or was not called yet — frontend shows English
     * with "Dịch tiếng Việt đang được tạo." notice.
     */
    private boolean translationPending;
}

package com.midori.entity;

/**
 * Supported question types for AI-generated and teacher-authored questions.
 *
 * <p>Render and validation rules:
 * <ul>
 *   <li>{@link #MULTIPLE_CHOICE} — N selectable options, exactly one correct.</li>
 *   <li>{@link #TRUE_FALSE} — exactly two options (True / False), exactly one correct.</li>
 *   <li>{@link #FILL_BLANK} — the question text must contain a blank marker
 *       ({@code ___} or {@code (blank)}); the answer is a single text value.</li>
 *   <li>{@link #SHORT_ANSWER} — a free-text response area; the answer is a
 *       reference text used for grading.</li>
 *   <li>{@link #MATCHING} — left/right pairs (kept for the historical schema).</li>
 * </ul>
 */
public enum QuestionType {
    MULTIPLE_CHOICE,
    TRUE_FALSE,
    FILL_BLANK,
    SHORT_ANSWER,
    MATCHING
}

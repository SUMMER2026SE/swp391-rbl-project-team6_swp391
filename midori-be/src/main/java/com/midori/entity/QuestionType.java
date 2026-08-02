package com.midori.entity;

/**
 * Supported question formats for AI-generated and teacher-authored questions.
 *
 * <p>Render and validation rules:
 * <ul>
 *   <li>{@link #MULTIPLE_CHOICE} — N selectable options, exactly one correct.</li>
 *   <li>{@link #TRUE_FALSE} — exactly two options (True / False), exactly one correct.</li>
 *   <li>{@link #FILL_BLANK} — the question text must contain a blank marker
 *       ({@code ___} or {@code (blank)}); the answer is a single text value.</li>
 *   <li>{@link #SHORT_ANSWER} — a free-text response area; the answer is a
 *       reference text used for grading.</li>
 *   <li>{@link #MATCHING} — left/right pairs (leftItems, rightItems, correctPairs).</li>
 *   <li>{@link #TRANSLATION} — sourceLanguage, targetLanguage, referenceAnswer,
 *       acceptedAnswers; supports JpToVi and ViToJp variants.</li>
 *   <li>{@link #SENTENCE_WRITING} — requiredVocabulary, requiredGrammar,
 *       referenceAnswer, rubric.</li>
 *   <li>{@link #ERROR_CORRECTION} — incorrectText, correctedText, explanation.</li>
 * </ul>
 *
 * <p>Not all formats are compatible with all skills. See the skill-format
 * compatibility matrix for valid combinations.
 */
public enum QuestionType {
    MULTIPLE_CHOICE,
    TRUE_FALSE,
    FILL_BLANK,
    SHORT_ANSWER,
    MATCHING,
    TRANSLATION,
    SENTENCE_WRITING,
    ERROR_CORRECTION
}

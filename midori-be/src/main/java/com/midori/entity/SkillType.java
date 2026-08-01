package com.midori.entity;

/**
 * Skill categories for questions.
 *
 * <p>Each skill represents a distinct learning domain:
 * <ul>
 *   <li>{@link #VOCABULARY} — word meaning, reading, translation.</li>
 *   <li>{@link #GRAMMAR} — sentence patterns, particles, conjugations.</li>
 *   <li>{@link #READING} — passage/dialogue comprehension.</li>
 *   <li>{@link #WRITING} — translation, sentence construction, error correction.</li>
 *   <li>{@link #LISTENING} — audio comprehension (out of scope for AI generation).</li>
 *   <li>{@link #KANJI} — kanji recognition and reading.</li>
 * </ul>
 *
 * <p>Not all skills support all question formats. See the skill-format
 * compatibility matrix in the frontend for valid combinations.
 */
public enum SkillType {
    VOCABULARY,
    GRAMMAR,
    READING,
    WRITING,
    LISTENING,
    KANJI
}

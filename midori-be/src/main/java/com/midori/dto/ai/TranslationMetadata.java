package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Format-specific metadata for TRANSLATION questions.
 * Supports Japanese-to-Vietnamese and Vietnamese-to-Japanese translation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranslationMetadata {
    /** "JA_TO_VI" or "VI_TO_JA" */
    private String direction;
    /** Original source text to translate */
    private String sourceText;
    /** Reference/correct translation */
    private String referenceAnswer;
    /** Alternative correct answers (e.g., natural synonyms) */
    private List<String> acceptedAnswers;
    /** Source language label (e.g., "Japanese", "Vietnamese") */
    private String sourceLanguage;
    /** Target language label (e.g., "Vietnamese", "Japanese") */
    private String targetLanguage;
}

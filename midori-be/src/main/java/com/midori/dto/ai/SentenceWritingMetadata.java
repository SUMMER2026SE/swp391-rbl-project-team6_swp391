package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Format-specific metadata for SENTENCE_WRITING questions.
 * Specifies required vocabulary, grammar patterns, or constraints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentenceWritingMetadata {
    /** Vocabulary items the sentence must use */
    private List<String> requiredVocabulary;
    /** Grammar patterns the sentence must demonstrate */
    private List<String> requiredGrammar;
    /** Reference/example answer */
    private String referenceAnswer;
    /** Alternative acceptable answers */
    private List<String> acceptedAnswers;
    /** Grading rubric or scoring hints */
    private String rubric;
    /** Writing prompt/instruction */
    private String prompt;
}

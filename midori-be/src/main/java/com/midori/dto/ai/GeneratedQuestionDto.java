package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class GeneratedQuestionDto {

    private String id;
    private String type;
    private String questionText;
    private List<String> options;
    private Integer correctAnswerIndex;
    private String correctAnswer; // Alternative to correctAnswerIndex for JSON compatibility
    private String explanation;
    private String difficulty;
    private String skill;
    // Format-specific metadata (serialized as JSON string for compatibility)
    private TranslationMetadata translationMetadata;
    private SentenceWritingMetadata sentenceWritingMetadata;
    private ErrorCorrectionMetadata errorCorrectionMetadata;
    private MatchingMetadata matchingMetadata;
}

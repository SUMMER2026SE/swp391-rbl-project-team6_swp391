package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingEvaluationResponse {
    private int overall;
    private int accuracy;
    private int similarity;
    private java.util.List<String> missingWords;
    private java.util.List<String> extraWords;
    private java.util.List<String> wrongWords;
    private boolean needAI;
    private java.util.List<String> feedback;
    private String validationError;

    public static ShadowingEvaluationResponse validationError(String reason) {
        return ShadowingEvaluationResponse.builder()
                .validationError(reason)
                .build();
    }

    public static ShadowingEvaluationResponse immediate(int overall, int accuracy, int similarity,
                                                        java.util.List<String> missingWords,
                                                        java.util.List<String> extraWords,
                                                        java.util.List<String> wrongWords) {
        return ShadowingEvaluationResponse.builder()
                .overall(overall)
                .accuracy(accuracy)
                .similarity(similarity)
                .missingWords(missingWords)
                .extraWords(extraWords)
                .wrongWords(wrongWords)
                .needAI(false)
                .feedback(java.util.Collections.emptyList())
                .build();
    }

    public static ShadowingEvaluationResponse withAI(int overall, int accuracy, int similarity,
                                                     java.util.List<String> missingWords,
                                                     java.util.List<String> extraWords,
                                                     java.util.List<String> wrongWords,
                                                     java.util.List<String> feedback) {
        return ShadowingEvaluationResponse.builder()
                .overall(overall)
                .accuracy(accuracy)
                .similarity(similarity)
                .missingWords(missingWords)
                .extraWords(extraWords)
                .wrongWords(wrongWords)
                .needAI(true)
                .feedback(feedback)
                .build();
    }
}

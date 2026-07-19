package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingEvaluationResponse {
    private int overall;
    private int accuracy;
    private int similarity;
    private List<String> missingWords;
    private List<String> extraWords;
    private List<String> wrongWords;
    private boolean needAI;
    private List<String> feedback;
    private String validationError;
    private String transcript;

    /**
     * Practice suggestions for the student.
     * Contains AI-generated suggestions, rule-based suggestions, or generic defaults.
     * Never null - always returns at least one suggestion.
     */
    @Builder.Default
    private List<String> practiceSuggestions = new ArrayList<>();

    public static ShadowingEvaluationResponse validationError(String reason) {
        return ShadowingEvaluationResponse.builder()
                .validationError(reason)
                .practiceSuggestions(new ArrayList<>())
                .build();
    }

    public static ShadowingEvaluationResponse immediate(int overall, int accuracy, int similarity,
                                                        List<String> missingWords,
                                                        List<String> extraWords,
                                                        List<String> wrongWords,
                                                        List<String> practiceSuggestions) {
        return ShadowingEvaluationResponse.builder()
                .overall(overall)
                .accuracy(accuracy)
                .similarity(similarity)
                .missingWords(missingWords)
                .extraWords(extraWords)
                .wrongWords(wrongWords)
                .needAI(false)
                .feedback(new ArrayList<>())
                .practiceSuggestions(practiceSuggestions != null ? practiceSuggestions : new ArrayList<>())
                .build();
    }

    public static ShadowingEvaluationResponse withAI(int overall, int accuracy, int similarity,
                                                     List<String> missingWords,
                                                     List<String> extraWords,
                                                     List<String> wrongWords,
                                                     List<String> feedback,
                                                     List<String> practiceSuggestions) {
        return ShadowingEvaluationResponse.builder()
                .overall(overall)
                .accuracy(accuracy)
                .similarity(similarity)
                .missingWords(missingWords)
                .extraWords(extraWords)
                .wrongWords(wrongWords)
                .needAI(true)
                .feedback(feedback)
                .practiceSuggestions(practiceSuggestions != null ? practiceSuggestions : new ArrayList<>())
                .build();
    }
}

package com.midori.service;

import com.midori.config.ShadowingEvaluationConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScoreEngine {

    private final ShadowingEvaluationConfig evaluationConfig;

    public int calculate(double accuracy, double similarity, double confidence, double cer, double wer) {
        double accuracyWeight = evaluationConfig.getAccuracyWeight();
        double similarityWeight = evaluationConfig.getSimilarityWeight();
        double confidenceWeight = evaluationConfig.getConfidenceWeight();

        double weighted = (accuracy * accuracyWeight)
                + (similarity * similarityWeight)
                + (confidence * confidenceWeight * 100);

        int rounded = (int) Math.round(weighted);
        if (cer > evaluationConfig.getCerThreshold() || wer > evaluationConfig.getWerThreshold()) {
            rounded = Math.min(rounded, 79);
        }
        return Math.max(0, Math.min(100, rounded));
    }
}

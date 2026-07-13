package com.midori.service;

import com.midori.config.ShadowingEvaluationConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PronunciationEvaluator {

    private final SimilarityEngine similarityEngine;
    private final ScoreEngine scoreEngine;
    private final ShadowingEvaluationConfig evaluationConfig;

    public EvaluatedSentence evaluate(String reference, String studentTranscript, SpeechRecognitionResult sttResult, String audioHash, AudioValidationResult validationResult) {
        SimilarityResult similarityResult = similarityEngine.calculate(reference, studentTranscript);
        SimilarityMetrics metrics = similarityResult.getMetrics();
        double characterSimilarity = metrics != null ? metrics.getCharacterSimilarity() : similarityResult.getSimilarity();
        double confidence = sttResult != null ? sttResult.confidence() : 0.5;
        double cer = metrics != null ? metrics.getCer() : 0;
        double wer = metrics != null ? metrics.getWer() : 0;
        int accuracy = (int) Math.round(Math.max(0, Math.min(100, characterSimilarity)));
        int similarity = similarityResult.getSimilarity();
        int overall = scoreEngine.calculate(accuracy, similarity, confidence, cer, wer);
        boolean needsAI = shouldUseAI(overall, confidence, cer, wer);

        long whisperLatency = 0;
        long audioDuration = validationResult != null ? validationResult.getDurationMs() : 0;
        String validationError = validationResult != null && !validationResult.isValid() ? validationResult.getReason() : null;

        return EvaluatedSentence.builder()
                .reference(reference)
                .studentTranscript(studentTranscript)
                .overallScore(overall)
                .accuracy(accuracy)
                .similarity(similarity)
                .missingWords(similarityResult.getMissingWords())
                .extraWords(similarityResult.getExtraWords())
                .wrongWords(similarityResult.getWrongWords())
                .needsAI(needsAI)
                .confidence(confidence)
                .cer(cer)
                .wer(wer)
                .audioHash(audioHash)
                .whisperLatency(whisperLatency)
                .audioDuration(audioDuration)
                .validationError(validationError)
                .similarityMetrics(metrics)
                .build();
    }

    private boolean shouldUseAI(int overall, double confidence, double cer, double wer) {
        return overall < evaluationConfig.getGeminiThreshold()
                || confidence < evaluationConfig.getConfidenceThreshold()
                || cer > evaluationConfig.getCerThreshold()
                || wer > evaluationConfig.getWerThreshold();
    }
}

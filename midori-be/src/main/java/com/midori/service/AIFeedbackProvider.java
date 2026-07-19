package com.midori.service;

import com.midori.dto.shadowing.PronunciationFeedback;

public interface AIFeedbackProvider {

    boolean isConfigured();

    PronunciationFeedback generateFeedback(String reference, String studentTranscript, SimilarityMetrics metrics, double confidence);
}

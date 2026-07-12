package com.midori.service;

public record SpeechRecognitionResult(
        String transcript,
        double confidence,
        String language,
        double durationSeconds,
        String modelUsed,
        String provider,
        long processingTimeMs
) {
}

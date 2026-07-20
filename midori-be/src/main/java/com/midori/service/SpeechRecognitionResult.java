package com.midori.service;

import java.util.List;
import java.util.Map;

public record SpeechRecognitionResult(
        String transcript,
        double confidence,
        String language,
        double durationSeconds,
        String modelUsed,
        String provider,
        long processingTimeMs,
        List<Map<String, Object>> segments
) {
}

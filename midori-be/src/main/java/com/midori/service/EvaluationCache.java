package com.midori.service;

import com.midori.config.ShadowingEvaluationConfig;
import com.midori.dto.shadowing.ShadowingEvaluationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class EvaluationCache {

    private final ShadowingEvaluationConfig evaluationConfig;

    private final Map<String, CachedEvaluation> cache = new LinkedHashMap<>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, CachedEvaluation> eldest) {
            return size() > evaluationConfig.getCacheMaxSize();
        }
    };

    public ShadowingEvaluationResponse get(String studentId, String videoId, Integer sentenceOrder, String audioHash) {
        String key = buildKey(studentId, videoId, sentenceOrder, audioHash);
        CachedEvaluation entry = cache.get(key);
        if (entry == null || entry.expired()) {
            if (entry != null) {
                cache.remove(key);
            }
            return null;
        }
        return entry.getResponse();
    }

    public void put(String studentId, String videoId, Integer sentenceOrder, String audioHash,
                    ShadowingEvaluationResponse response) {
        String key = buildKey(studentId, videoId, sentenceOrder, audioHash);
        cache.put(key, CachedEvaluation.builder()
                .response(response)
                .expiresAt(Instant.now().plus(Duration.ofMinutes(evaluationConfig.getCacheTtlMinutes())))
                .build());
    }

    private String buildKey(String studentId, String videoId, Integer sentenceOrder, String audioHash) {
        return studentId + "|" + videoId + "|" + sentenceOrder + "|" + normalize(audioHash);
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").trim();
    }
}

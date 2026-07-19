package com.midori.service;

import com.midori.config.ShadowingSpeechConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DefaultSpeechModelSelector implements SpeechModelSelector {

    private final ShadowingSpeechConfig speechConfig;

    @Override
    public String selectModel(AudioMetadata metadata) {
        String profile = speechConfig.getProfile();
        ShadowingSpeechConfig.Models models = speechConfig.getModels();

        if (models == null) {
            return "whisper-large-v3";
        }

        return switch (profile == null ? "balanced" : profile.toLowerCase()) {
            case "fast" -> models.getFast() != null ? models.getFast() : models.getBalanced();
            case "accurate" -> models.getAccurate() != null ? models.getAccurate() : models.getBalanced();
            default -> models.getBalanced() != null ? models.getBalanced() : "whisper-large-v3";
        };
    }
}

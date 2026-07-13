package com.midori.service;

import java.util.UUID;

public interface ShadowingAiProcessingService {
    void processVideoAsync(UUID videoId);
    void retryTranslationAsync(UUID videoId);
}

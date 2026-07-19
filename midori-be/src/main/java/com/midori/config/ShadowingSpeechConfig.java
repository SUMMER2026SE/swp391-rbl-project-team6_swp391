package com.midori.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "shadowing.speech")
@Data
public class ShadowingSpeechConfig {
    private String provider = "groq";
    private String profile = "balanced";
    private Models models = new Models();
    private long apiTimeoutSeconds = 120;

    @Data
    public static class Models {
        private String fast = "whisper-large-v3-turbo";
        private String balanced = "whisper-large-v3";
        private String accurate = "whisper-large-v3";
    }
}

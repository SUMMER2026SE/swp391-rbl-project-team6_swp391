package com.midori.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiConfigProperties {

    private String provider = "OPENAI";
    private String model = "gpt-4o";
    private int timeoutSeconds = 120;
    private double temperature = 0.1;
    private int maxTokens = 8192;

    private OpenAi openai = new OpenAi();
    private Gemini gemini = new Gemini();
    private DeepSeek deepseek = new DeepSeek();

    @Data
    public static class OpenAi {
        private String apiKey;
        private String baseUrl = "https://api.openai.com/v1";
        private String model = "gpt-4o";
    }

    @Data
    public static class Gemini {
        private String apiKey;
        private String baseUrl = "https://generativelanguage.googleapis.com";
        private String model = "gemini-1.5-flash";
    }

    @Data
    public static class DeepSeek {
        private String apiKey;
        private String baseUrl = "https://api.deepseek.com/v1";
        private String model = "deepseek-chat";
    }
}

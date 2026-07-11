package com.midori.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

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

    // Getters
    public String getProvider() { return provider; }
    public String getModel() { return model; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public double getTemperature() { return temperature; }
    public int getMaxTokens() { return maxTokens; }
    public OpenAi getOpenai() { return openai; }
    public Gemini getGemini() { return gemini; }
    public DeepSeek getDeepseek() { return deepseek; }

    // Setters
    public void setProvider(String provider) { this.provider = provider; }
    public void setModel(String model) { this.model = model; }
    public void setTimeoutSeconds(int v) { this.timeoutSeconds = v; }
    public void setTemperature(double v) { this.temperature = v; }
    public void setMaxTokens(int v) { this.maxTokens = v; }
    public void setOpenai(OpenAi v) { this.openai = v; }
    public void setGemini(Gemini v) { this.gemini = v; }
    public void setDeepseek(DeepSeek v) { this.deepseek = v; }

    public static class OpenAi {
        private String apiKey;
        private String baseUrl = "https://api.openai.com/v1";
        private String model = "gpt-4o";
        public String getApiKey() { return apiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public void setApiKey(String v) { this.apiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
    }

    public static class Gemini {
        private String apiKey;
        private String baseUrl = "https://generativelanguage.googleapis.com";
        private String model = "gemini-1.5-flash";
        public String getApiKey() { return apiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public void setApiKey(String v) { this.apiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
    }

    public static class DeepSeek {
        private String apiKey;
        private String baseUrl = "https://api.deepseek.com/v1";
        private String model = "deepseek-chat";
        public String getApiKey() { return apiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public void setApiKey(String v) { this.apiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
    }
}

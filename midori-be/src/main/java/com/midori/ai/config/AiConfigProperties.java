package com.midori.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for AI providers.
 * 
 * Supports:
 * - Multiple API keys for Gemini (comma-separated)
 * - Automatic fallback between keys
 * - Provider selection (GEMINI, OPENAI, DEEPSEEK, OPENROUTER)
 * 
 * Configuration example:
 * 
 * ai:
 *   provider: gemini
 *   gemini:
 *     api-keys: key1,key2,key3  # Multiple keys for fallback
 *     model: ${GEMINI_MODEL:gemini-3.5-flash}      # configurable — no hardcoded default in Java
 *     fallback-models: ${GEMINI_FALLBACK_MODELS:gemini-3.5-flash,gemini-2.5-flash,gemini-2.5-pro}
 *   openai:
 *     api-key: sk-xxx
 *     model: gpt-4o
 *   deepseek:
 *     api-key: sk-xxx
 *     model: deepseek-chat
 *   openrouter:
 *     api-key: sk-xxx
 *     models: openrouter/free
 */
@Component
@ConfigurationProperties(prefix = "ai")
public class AiConfigProperties {

    private String provider = "OPENAI";
    private String model = "gpt-4o";
    private int timeoutSeconds = 120;
    private double temperature = 0.1;
    private int maxTokens = 8192;

    private OpenAiConfig openai = new OpenAiConfig();
    private GeminiConfig gemini = new GeminiConfig();
    private DeepSeekConfig deepseek = new DeepSeekConfig();
    private OpenRouterConfig openrouter = new OpenRouterConfig();

    // ============================================================
    // Getters
    // ============================================================

    public String getProvider() { return provider; }
    public String getModel() { return model; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public double getTemperature() { return temperature; }
    public int getMaxTokens() { return maxTokens; }
    public OpenAiConfig getOpenai() { return openai; }
    public GeminiConfig getGemini() { return gemini; }
    public DeepSeekConfig getDeepseek() { return deepseek; }
    public OpenRouterConfig getOpenrouter() { return openrouter; }

    // ============================================================
    // Setters
    // ============================================================

    public void setProvider(String provider) { this.provider = provider; }
    public void setModel(String model) { this.model = model; }
    public void setTimeoutSeconds(int v) { this.timeoutSeconds = v; }
    public void setTemperature(double v) { this.temperature = v; }
    public void setMaxTokens(int v) { this.maxTokens = v; }
    public void setOpenai(OpenAiConfig v) { this.openai = v; }
    public void setGemini(GeminiConfig v) { this.gemini = v; }
    public void setDeepseek(DeepSeekConfig v) { this.deepseek = v; }
    public void setOpenrouter(OpenRouterConfig v) { this.openrouter = v; }

    // ============================================================
    // OpenAI Configuration
    // ============================================================

    public static class OpenAiConfig {
        private String apiKey;
        private String baseUrl = "https://api.openai.com/v1";
        private String model = "gpt-4o";

        public String getApiKey() { return apiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public void setApiKey(String v) { this.apiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
        public boolean isConfigured() { return apiKey != null && !apiKey.isBlank(); }
    }

    // ============================================================
    // Gemini Configuration (supports multiple keys)
    // ============================================================

    public static class GeminiConfig {
        private String apiKeys;  // Comma-separated: key1,key2,key3
        private String singleApiKey;  // Legacy single key support
        private String baseUrl = "https://generativelanguage.googleapis.com";
        // No Java-level default — YAML / env-var is the single source of truth.
        // If null, validateConfig() will fail-fast before any API call.
        private String model = null;
        // Comma-separated fallback model names tried in order when primary fails.
        // e.g. "gemini-3.5-flash,gemini-2.5-flash,gemini-2.5-pro"
        private String fallbackModels = null;
        // Available models allowed for automatic task-based selection.
        // When blank, the system falls back to primary/fallback models.
        private String models = null;
        // Task-specific model mapping. Keys must match AiTaskType names.
        // Example: SIMPLE_TRANSLATION=gemini-3.5-flash,COMPLEX_REASONING=gemini-2.5-pro
        private java.util.Map<String, String> taskModelMapping = new java.util.LinkedHashMap<>();
        // Optional fallback chain used when a task-selected model is unavailable.
        private String taskModelFallbacks = null;

        /**
         * Get all API keys as an array.
         * Supports both comma-separated string and legacy single key.
         */
        public String[] getApiKeys() {
            // Check for multiple keys first
            if (apiKeys != null && !apiKeys.isBlank() && apiKeys.contains(",")) {
                String[] keys = apiKeys.split(",");
                for (int i = 0; i < keys.length; i++) {
                    keys[i] = keys[i].trim();
                }
                return keys;
            }
            // Fall back to single key
            String key = getEffectiveApiKey();
            return key != null ? new String[]{key} : new String[0];
        }

        /**
         * Get the primary/first API key.
         */
        public String getPrimaryApiKey() {
            String[] keys = getApiKeys();
            return keys.length > 0 ? keys[0] : null;
        }

        /**
         * Get the effective API key (single key for legacy compatibility).
         */
        public String getEffectiveApiKey() {
            if (apiKeys != null && !apiKeys.isBlank()) {
                // Return first key if comma-separated
                if (apiKeys.contains(",")) {
                    return apiKeys.split(",")[0].trim();
                }
                return apiKeys.trim();
            }
            return singleApiKey != null && !singleApiKey.isBlank() ? singleApiKey : null;
        }

        public String getApiKeysStr() { return apiKeys; }
        public String getSingleApiKey() { return singleApiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public String getModels() { return models; }
        public java.util.Map<String, String> getTaskModelMapping() { return taskModelMapping; }
        public String getTaskModelFallbacks() { return taskModelFallbacks; }

        public void setApiKeys(String v) { this.apiKeys = v; }
        public void setSingleApiKey(String v) { this.singleApiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
        public void setModels(String v) { this.models = v; }
        public void setTaskModelMapping(java.util.Map<String, String> v) { this.taskModelMapping = v; }
        public void setTaskModelFallbacks(String v) { this.taskModelFallbacks = v; }
        public void setFallbackModels(String v) { this.fallbackModels = v; }

        /**
         * Returns the comma-separated fallback models string.
         */
        public String getFallbackModels() { return fallbackModels; }

        /**
         * Parses the fallback models string into an ordered List.
         * Trims whitespace around each entry and filters blank entries.
         */
        public java.util.List<String> getFallbackModelsList() {
            if (fallbackModels == null || fallbackModels.isBlank()) {
                return java.util.List.of();
            }
            return java.util.Arrays.stream(fallbackModels.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(java.util.stream.Collectors.toList());
        }

        /**
         * Legacy support: also accepts "api-key" as single key.
         */
        public void setApiKey(String v) { this.singleApiKey = v; }
        public String getApiKey() { return getEffectiveApiKey(); }

        public boolean isConfigured() { 
            return (apiKeys != null && !apiKeys.isBlank()) || 
                   (singleApiKey != null && !singleApiKey.isBlank()); 
        }

        public int getKeyCount() {
            if (apiKeys != null && !apiKeys.isBlank() && apiKeys.contains(",")) {
                return apiKeys.split(",").length;
            }
            return isConfigured() ? 1 : 0;
        }
    }

    // ============================================================
    // DeepSeek Configuration
    // ============================================================

    public static class DeepSeekConfig {
        private String apiKey;
        private String baseUrl = "https://api.deepseek.com/v1";
        private String model = "deepseek-chat";

        public String getApiKey() { return apiKey; }
        public String getBaseUrl() { return baseUrl; }
        public String getModel() { return model; }
        public void setApiKey(String v) { this.apiKey = v; }
        public void setBaseUrl(String v) { this.baseUrl = v; }
        public void setModel(String v) { this.model = v; }
        public boolean isConfigured() { return apiKey != null && !apiKey.isBlank(); }
    }

    // ============================================================
    // OpenRouter Configuration
    // ============================================================

    public static class OpenRouterConfig {
        private String apiKey;
        private String models = "openrouter/free";
        private String fallbackModels = "openai/gpt-oss-120b:free";
        private String referer = "http://localhost:8081";
        private String appTitle = "MIDORI AI Sensei";
        private int chatTimeoutMs = 15000;
        private int quizTimeoutMs = 25000;
        private int connectTimeoutMs = 5000;
        private int chatMaxTokens = 1400;
        private int quizMaxTokens = 4096;

        public String getApiKey() { return apiKey; }
        public String getModels() { return models; }
        public String getFallbackModels() { return fallbackModels; }
        public String getReferer() { return referer; }
        public String getAppTitle() { return appTitle; }
        public int getChatTimeoutMs() { return chatTimeoutMs; }
        public int getQuizTimeoutMs() { return quizTimeoutMs; }
        public int getConnectTimeoutMs() { return connectTimeoutMs; }
        public int getChatMaxTokens() { return chatMaxTokens; }
        public int getQuizMaxTokens() { return quizMaxTokens; }

        public void setApiKey(String v) { this.apiKey = v; }
        public void setModels(String v) { this.models = v; }
        public void setFallbackModels(String v) { this.fallbackModels = v; }
        public void setReferer(String v) { this.referer = v; }
        public void setAppTitle(String v) { this.appTitle = v; }
        public void setChatTimeoutMs(int v) { this.chatTimeoutMs = v; }
        public void setQuizTimeoutMs(int v) { this.quizTimeoutMs = v; }
        public void setConnectTimeoutMs(int v) { this.connectTimeoutMs = v; }
        public void setChatMaxTokens(int v) { this.chatMaxTokens = v; }
        public void setQuizMaxTokens(int v) { this.quizMaxTokens = v; }

        public boolean isConfigured() { return apiKey != null && !apiKey.isBlank(); }
    }
}

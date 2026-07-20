package com.midori.config;

import com.midori.ai.model.GeminiModel;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration for Shadowing (speaking practice) evaluation.
 * 
 * <p>Supports both string-based and enum-based model configuration.
 * For model selection, prefer using {@link #getGeminiModelEnum()} 
 * which provides type-safe access to model configuration.
 */
@Component
@ConfigurationProperties(prefix = "shadowing.evaluation")
public class ShadowingEvaluationConfig {
    
    private double similarityThreshold = 0.80;
    private double geminiThreshold = 80.0;
    private double confidenceThreshold = 0.55;
    private double werThreshold = 0.50;
    private double cerThreshold = 0.40;
    private int maxRecordingDurationSeconds = 15;
    private int minRecordingDurationMs = 200;
    
    /** String-based model name (e.g., "gemini-2.5-flash") */
    private String geminiModel = "gemini-3.5-flash";
    
    private String aiProvider = "gemini";
    private long apiTimeoutSeconds = 120;
    private long cacheTtlMinutes = 60;
    private int cacheMaxSize = 10000;
    private double accuracyWeight = 0.60;
    private double similarityWeight = 0.20;
    private double confidenceWeight = 0.20;

    // ============================================================
    // Basic Getters/Setters
    // ============================================================

    public double getSimilarityThreshold() {
        return similarityThreshold;
    }

    public void setSimilarityThreshold(double similarityThreshold) {
        this.similarityThreshold = similarityThreshold;
    }

    public double getGeminiThreshold() {
        return geminiThreshold;
    }

    public void setGeminiThreshold(double geminiThreshold) {
        this.geminiThreshold = geminiThreshold;
    }

    public int getMaxRecordingDurationSeconds() {
        return maxRecordingDurationSeconds;
    }

    public void setMaxRecordingDurationSeconds(int maxRecordingDurationSeconds) {
        this.maxRecordingDurationSeconds = maxRecordingDurationSeconds;
    }

    // ============================================================
    // Model Getters/Setters (both string and enum)
    // ============================================================

    /**
     * Get the configured model as string.
     */
    public String getGeminiModel() {
        return geminiModel;
    }

    /**
     * Set the model using string name.
     */
    public void setGeminiModel(String geminiModel) {
        this.geminiModel = geminiModel;
    }

    /**
     * Get the configured model as GeminiModel enum.
     * Falls back to default if string doesn't match any known model.
     */
    public GeminiModel getGeminiModelEnum() {
        return GeminiModel.fromApiModelNameOrDefault(geminiModel, GeminiModel.GEMINI_25_FLASH);
    }

    /**
     * Set the model using GeminiModel enum.
     */
    public void setGeminiModelEnum(GeminiModel model) {
        if (model != null) {
            this.geminiModel = model.getApiModelName();
        }
    }

    public double getConfidenceThreshold() {
        return confidenceThreshold;
    }

    public void setConfidenceThreshold(double confidenceThreshold) {
        this.confidenceThreshold = confidenceThreshold;
    }

    public double getWerThreshold() {
        return werThreshold;
    }

    public void setWerThreshold(double werThreshold) {
        this.werThreshold = werThreshold;
    }

    public double getCerThreshold() {
        return cerThreshold;
    }

    public void setCerThreshold(double cerThreshold) {
        this.cerThreshold = cerThreshold;
    }

    public int getMinRecordingDurationMs() {
        return minRecordingDurationMs;
    }

    public void setMinRecordingDurationMs(int minRecordingDurationMs) {
        this.minRecordingDurationMs = minRecordingDurationMs;
    }

    public String getAiProvider() {
        return aiProvider;
    }

    public void setAiProvider(String aiProvider) {
        this.aiProvider = aiProvider;
    }

    public double getAccuracyWeight() {
        return accuracyWeight;
    }

    public void setAccuracyWeight(double accuracyWeight) {
        this.accuracyWeight = accuracyWeight;
    }

    public double getSimilarityWeight() {
        return similarityWeight;
    }

    public void setSimilarityWeight(double similarityWeight) {
        this.similarityWeight = similarityWeight;
    }

    public double getConfidenceWeight() {
        return confidenceWeight;
    }

    public void setConfidenceWeight(double confidenceWeight) {
        this.confidenceWeight = confidenceWeight;
    }

    public long getApiTimeoutSeconds() {
        return apiTimeoutSeconds;
    }

    public void setApiTimeoutSeconds(long apiTimeoutSeconds) {
        this.apiTimeoutSeconds = apiTimeoutSeconds;
    }

    public long getCacheTtlMinutes() {
        return cacheTtlMinutes;
    }

    public void setCacheTtlMinutes(long cacheTtlMinutes) {
        this.cacheTtlMinutes = cacheTtlMinutes;
    }

    public int getCacheMaxSize() {
        return cacheMaxSize;
    }

    public void setCacheMaxSize(int cacheMaxSize) {
        this.cacheMaxSize = cacheMaxSize;
    }

    // ============================================================
    // Convenience Methods
    // ============================================================

    /**
     * Get model info string for logging.
     */
    public String getModelInfo() {
        GeminiModel model = getGeminiModelEnum();
        return String.format("%s [cap=%d, cost=%d]",
                model.getApiModelName(),
                model.getCapabilityLevel(),
                model.getCostLevel());
    }
}

package com.midori.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

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
    private String geminiModel = "gemini-3.5-flash";
    private String aiProvider = "gemini";
    private long apiTimeoutSeconds = 120;
    private long cacheTtlMinutes = 60;
    private int cacheMaxSize = 10000;
    private double accuracyWeight = 0.60;
    private double similarityWeight = 0.20;
    private double confidenceWeight = 0.20;

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

    public String getGeminiModel() {
        return geminiModel;
    }

    public void setGeminiModel(String geminiModel) {
        this.geminiModel = geminiModel;
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
}

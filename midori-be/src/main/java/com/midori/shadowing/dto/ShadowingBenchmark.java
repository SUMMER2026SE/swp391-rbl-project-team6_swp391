package com.midori.shadowing.dto;

/**
 * Holds per-step benchmark timings (in milliseconds) for the Shadowing pipeline.
 * Used to compose a full end-to-end benchmark from both upload and AI processing phases.
 */
public class ShadowingBenchmark {

    private long uploadLocalMs;
    private long uploadSupabaseMs;
    private long ffmpegMs;
    private long groqWhisperMs;
    private long geminiMs;
    private long dbSaveMs;

    public ShadowingBenchmark() {}

    public long getUploadLocalMs() { return uploadLocalMs; }
    public void setUploadLocalMs(long uploadLocalMs) { this.uploadLocalMs = uploadLocalMs; }

    public long getUploadSupabaseMs() { return uploadSupabaseMs; }
    public void setUploadSupabaseMs(long uploadSupabaseMs) { this.uploadSupabaseMs = uploadSupabaseMs; }

    public long getFfmpegMs() { return ffmpegMs; }
    public void setFfmpegMs(long ffmpegMs) { this.ffmpegMs = ffmpegMs; }

    public long getGroqWhisperMs() { return groqWhisperMs; }
    public void setGroqWhisperMs(long groqWhisperMs) { this.groqWhisperMs = groqWhisperMs; }

    public long getGeminiMs() { return geminiMs; }
    public void setGeminiMs(long geminiMs) { this.geminiMs = geminiMs; }

    public long getDbSaveMs() { return dbSaveMs; }
    public void setDbSaveMs(long dbSaveMs) { this.dbSaveMs = dbSaveMs; }

    public long getTotalMs() {
        return uploadLocalMs + uploadSupabaseMs + ffmpegMs + groqWhisperMs + geminiMs + dbSaveMs;
    }

    /**
     * Formats a millisecond value as a string with 2 decimal places (seconds).
     */
    public static String fmtSec(long ms) {
        return String.format("%.2f s", ms / 1000.0);
    }
}

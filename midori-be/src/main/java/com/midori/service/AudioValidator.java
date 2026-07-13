package com.midori.service;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

@Component
public class AudioValidator {

    private static final long MIN_DURATION_MS = 200;
    private static final long MAX_SIZE_BYTES = 50 * 1024 * 1024;
    private static final double SILENCE_THRESHOLD = 0.01;
    private static final double QUIET_THRESHOLD = 0.05;

    public AudioValidationResult validate(byte[] audio, String contentType, long maxDurationMs) {
        if (audio == null || audio.length == 0) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording is empty.")
                    .build();
        }

        if (contentType == null || contentType.isBlank()) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Unsupported audio format.")
                    .build();
        }

        String normalized = contentType.toLowerCase();
        if (!normalized.startsWith("audio/") && !normalized.endsWith("wav") && !normalized.endsWith("mp3")
                && !normalized.endsWith("webm") && !normalized.endsWith("ogg") && !normalized.endsWith("m4a")) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Unsupported audio format.")
                    .build();
        }

        if (audio.length > MAX_SIZE_BYTES) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording file is too large.")
                    .build();
        }

        long durationMs = estimateDurationMs(audio);
        if (durationMs < MIN_DURATION_MS) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording is too short.")
                    .durationMs(durationMs)
                    .build();
        }

        if (durationMs > maxDurationMs) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording exceeds maximum duration.")
                    .durationMs(durationMs)
                    .build();
        }

        AudioAnalysis analysis = analyzeLoudness(audio);
        if (analysis.silenceDetected) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording appears to be silent.")
                    .durationMs(durationMs)
                    .loudness(analysis.loudness)
                    .silenceDetected(true)
                    .build();
        }

        if (analysis.tooQuiet) {
            return AudioValidationResult.builder()
                    .valid(false)
                    .reason("Recording volume is too low.")
                    .durationMs(durationMs)
                    .loudness(analysis.loudness)
                    .tooQuiet(true)
                    .build();
        }

        AudioMetadata metadata = AudioMetadata.builder()
                .durationMs(durationMs)
                .channels(1)
                .mimeType(normalized)
                .size(audio.length)
                .quality(analysis.loudness < QUIET_THRESHOLD ? "low" : "normal")
                .build();

        return AudioValidationResult.builder()
                .valid(true)
                .durationMs(durationMs)
                .loudness(analysis.loudness)
                .silenceDetected(false)
                .tooQuiet(false)
                .metadata(metadata)
                .build();
    }

    private long estimateDurationMs(byte[] audio) {
        return Math.max(100, audio.length / 16);
    }

    private AudioAnalysis analyzeLoudness(byte[] audio) {
        long sum = 0;
        for (byte b : audio) {
            int sample = b & 0xFF;
            sum += Math.abs(sample - 128);
        }

        double average = audio.length == 0 ? 0 : (sum / (double) audio.length);
        double loudness = Math.min(1.0, average / 64.0);
        return new AudioAnalysis(loudness < SILENCE_THRESHOLD, loudness < QUIET_THRESHOLD, loudness);
    }

    private record AudioAnalysis(boolean silenceDetected, boolean tooQuiet, double loudness) {
    }
}

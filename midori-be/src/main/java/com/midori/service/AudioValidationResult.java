package com.midori.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AudioValidationResult {
    private boolean valid;
    private String reason;
    private long durationMs;
    private double loudness;
    private boolean silenceDetected;
    private boolean tooQuiet;
    private AudioMetadata metadata;
}

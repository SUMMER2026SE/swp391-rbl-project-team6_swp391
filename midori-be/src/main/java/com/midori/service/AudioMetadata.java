package com.midori.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AudioMetadata {
    private long durationMs;
    private Integer sampleRate;
    private Integer channels;
    private String mimeType;
    private long size;
    private String languageHint;
    private String quality;
}

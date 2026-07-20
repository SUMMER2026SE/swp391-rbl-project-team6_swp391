package com.midori.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SttResult {
    private String transcript;
    private double confidence;
    private double durationSeconds;
    private String language;
}

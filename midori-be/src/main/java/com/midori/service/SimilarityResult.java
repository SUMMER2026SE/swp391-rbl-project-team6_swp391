package com.midori.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarityResult {
    private int similarity;
    private List<String> missingWords;
    private List<String> extraWords;
    private List<String> wrongWords;
    private SimilarityMetrics metrics;
}

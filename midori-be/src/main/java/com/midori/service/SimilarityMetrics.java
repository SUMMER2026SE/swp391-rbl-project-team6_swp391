package com.midori.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarityMetrics {
    private double characterSimilarity;
    private double wordSimilarity;
    private double tokenSimilarity;
    private int levenshteinDistance;
    private double cer;
    private double wer;
    private int missingWordsCount;
    private int extraWordsCount;
    private int wrongWordsCount;
}

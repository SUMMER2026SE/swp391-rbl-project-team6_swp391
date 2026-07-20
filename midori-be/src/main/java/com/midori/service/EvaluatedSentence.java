package com.midori.service;

import com.midori.dto.shadowing.EvaluationLogEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluatedSentence {
    private String reference;
    private String studentTranscript;
    private int overallScore;
    private int accuracy;
    private int similarity;
    private List<String> missingWords;
    private List<String> extraWords;
    private List<String> wrongWords;
    private boolean needsAI;
    private double confidence;
    private double cer;
    private double wer;
    private String audioHash;
    private long whisperLatency;
    private long audioDuration;
    private String validationError;
    private SimilarityMetrics similarityMetrics;

    public SimilarityMetrics getSimilarityMetrics() {
        return similarityMetrics;
    }

    public List<String> getMissingWords() {
        return missingWords != null ? missingWords : Collections.emptyList();
    }

    public List<String> getExtraWords() {
        return extraWords != null ? extraWords : Collections.emptyList();
    }

    public List<String> getWrongWords() {
        return wrongWords != null ? wrongWords : Collections.emptyList();
    }
}

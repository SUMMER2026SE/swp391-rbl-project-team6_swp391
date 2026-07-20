package com.midori.dto.shadowing;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EvaluationLogEvent {
    private String studentId;
    private String sentenceId;
    private String audioHash;
    private long audioDuration;
    private long whisperLatency;
    private double whisperConfidence;
    private double similarity;
    private double cer;
    private double wer;
    private int overallScore;
    private boolean geminiCalled;
    private boolean cacheHit;
    private boolean cacheMiss;
    private long evaluationDuration;
}

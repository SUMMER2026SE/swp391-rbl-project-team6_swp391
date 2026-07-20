package com.midori.service;

import com.midori.dto.shadowing.EvaluationLogEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EvaluationLogger {

    public void log(EvaluationLogEvent event) {
        log.info("[EvaluationLog] studentId={} sentenceId={} audioHash={} audioDuration={} whisperLatency={} whisperConfidence={} similarity={} cer={} wer={} overall={} gemini={} cacheHit={} cacheMiss={} evaluationDuration={}",
                event.getStudentId(),
                event.getSentenceId(),
                event.getAudioHash(),
                event.getAudioDuration(),
                event.getWhisperLatency(),
                event.getWhisperConfidence(),
                event.getSimilarity(),
                event.getCer(),
                event.getWer(),
                event.getOverallScore(),
                event.isGeminiCalled(),
                event.isCacheHit(),
                event.isCacheMiss(),
                event.getEvaluationDuration());
    }
}

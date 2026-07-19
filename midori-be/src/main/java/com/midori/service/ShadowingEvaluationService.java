package com.midori.service;

import com.midori.config.ShadowingEvaluationConfig;
import com.midori.config.ShadowingSpeechConfig;
import com.midori.dto.shadowing.*;
import com.midori.entity.ShadowingTranscript;
import com.midori.repository.ShadowingTranscriptRepository;
import com.midori.repository.ShadowingVideoRepository;
import com.midori.service.impl.SpeechToTextServiceImpl;
import com.midori.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShadowingEvaluationService {

    private final ShadowingEvaluationConfig evaluationConfig;
    private final ShadowingSpeechConfig speechConfig;
    private final CurrentUserProvider currentUserProvider;
    private final ShadowingVideoRepository shadowingVideoRepository;
    private final ShadowingTranscriptRepository shadowingTranscriptRepository;
    private final SpeechToTextServiceImpl speechToTextService;
    private final AudioValidator audioValidator;
    private final AudioHashGenerator audioHashGenerator;
    private final PronunciationEvaluator pronunciationEvaluator;
    private final AIFeedbackProvider geminiFeedbackProvider;
    private final EvaluationCache evaluationCache;
    private final EvaluationLogger evaluationLogger;
    private final PracticeSuggestionService practiceSuggestionService;

    public ShadowingEvaluationResponse evaluateSentence(MultipartFile audioFile,
                                                        String videoId,
                                                        int sentenceOrder,
                                                        String traceId) {
        long pipelineStart = System.currentTimeMillis();
        String studentId = currentUserProvider.requireStudentId();
        UUID parsedVideoId = UUID.fromString(videoId);

        int zeroBasedSentenceOrder = sentenceOrder - 1;
        if (zeroBasedSentenceOrder < 0) {
            log.warn("[TRACE] id={} event=EVALUATE_INVALID_SENTENCE_ORDER sentenceOrder={}", traceId, sentenceOrder);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sentenceOrder");
        }

        ShadowingTranscript transcript = shadowingTranscriptRepository.findByShadowingVideoIdOrderBySentenceOrderAsc(parsedVideoId)
                .stream()
                .filter(item -> item.getSentenceOrder() != null && item.getSentenceOrder().equals(zeroBasedSentenceOrder))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sentence not found"));

        String reference = transcript.getJpText();
        if (reference == null) reference = "";

        log.info("[TRACE] id={} event=REFERENCE_LOADED sentenceId={} sentenceOrder={} text={}", traceId, transcript.getId(), zeroBasedSentenceOrder, reference);

        byte[] audioBytes;
        try {
            audioBytes = audioFile != null ? audioFile.getBytes() : null;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read audio file bytes: " + e.getMessage());
        }

        AudioValidationResult validationResult = audioValidator.validate(
                audioBytes,
                audioFile != null ? audioFile.getContentType() : null,
                speechConfig.getApiTimeoutSeconds() * 1000
        );

        if (!validationResult.isValid()) {
            log.warn("[TRACE] id={} event=AUDIO_INVALID sentenceId={} reason={} durationMs={}", traceId, transcript.getId(), validationResult.getReason(), validationResult.getDurationMs());
            return ShadowingEvaluationResponse.validationError(validationResult.getReason());
        }

        String audioHash = audioHashGenerator.hash(audioBytes);
        log.info("[TRACE] id={} event=AUDIO_VALIDATED sentenceId={} durationMs={} hash={}", traceId, transcript.getId(), validationResult.getDurationMs(), audioHash);

        boolean cacheHit = false;
        boolean cacheMiss = false;
        ShadowingEvaluationResponse cached = evaluationCache.get(studentId, videoId, zeroBasedSentenceOrder, audioHash);
        if (cached != null) {
            cacheHit = true;
            log.info("[TRACE] id={} event=CACHE_HIT sentenceId={}", traceId, transcript.getId());
            evaluationLogger.log(EvaluationLogEvent.builder()
                    .studentId(studentId)
                    .sentenceId(String.valueOf(transcript.getId()))
                    .audioHash(audioHash)
                    .audioDuration(validationResult.getDurationMs())
                    .geminiCalled(false)
                    .cacheHit(true)
                    .cacheMiss(false)
                    .build());
            return cached;
        }
        cacheMiss = true;
        log.info("[TRACE] id={} event=CACHE_MISS sentenceId={}", traceId, transcript.getId());

        SpeechRecognitionResult sttResult;
        try {
            sttResult = speechToTextService.transcribe(audioFile);
        } catch (IOException ex) {
            log.warn("[TRACE] id={} event=WHISPER_FAILED sentenceId={} reason={}", traceId, transcript.getId(), ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio transcription failed: " + ex.getMessage());
        }
        long whisperLatency = System.currentTimeMillis() - pipelineStart;
        log.info("[TRACE] id={} event=WHISPER_RESPONSE sentenceId={} transcript={} confidence={} language={}", traceId, transcript.getId(), sttResult.transcript(), sttResult.confidence(), sttResult.language());

        long evaluationStart = System.currentTimeMillis();
        EvaluatedSentence evaluated = pronunciationEvaluator.evaluate(reference, sttResult.transcript(), sttResult, audioHash, validationResult);
        long evaluationDuration = System.currentTimeMillis() - evaluationStart;
        log.info("[TRACE] id={} event=EVALUATION_COMPUTED sentenceId={} overall={} accuracy={} similarity={}", traceId, transcript.getId(), evaluated.getOverallScore(), evaluated.getAccuracy(), evaluated.getSimilarity());

        ShadowingEvaluationResponse response;
        List<String> practiceSuggestions;

        if (evaluated.isNeedsAI() && geminiFeedbackProvider.isConfigured()) {
            SimilarityMetrics metrics = evaluated.getSimilarityMetrics() != null
                    ? evaluated.getSimilarityMetrics()
                    : SimilarityMetrics.builder()
                    .characterSimilarity(evaluated.getSimilarity())
                    .missingWordsCount(evaluated.getMissingWords().size())
                    .extraWordsCount(evaluated.getExtraWords().size())
                    .wrongWordsCount(evaluated.getWrongWords().size())
                    .build();
            try {
                PronunciationFeedback aiFeedback = geminiFeedbackProvider.generateFeedback(
                        reference, sttResult.transcript(), metrics, evaluated.getConfidence());
                List<String> aiSuggestions = aiFeedback.getFeedback();
                // Merge AI suggestions with rule-based suggestions
                practiceSuggestions = practiceSuggestionService.generateWithAI(evaluated, aiSuggestions);
                response = ShadowingEvaluationResponse.withAI(
                        evaluated.getOverallScore(),
                        evaluated.getAccuracy(),
                        evaluated.getSimilarity(),
                        evaluated.getMissingWords(),
                        evaluated.getExtraWords(),
                        evaluated.getWrongWords(),
                        aiSuggestions,
                        practiceSuggestions
                );
                log.info("[TRACE] id={} event=AI_FEEDBACK_GENERATED sentenceId={}", traceId, transcript.getId());
            } catch (Exception ex) {
                log.warn("[TRACE] id={} event=AI_FEEDBACK_FAILED sentenceId={} reason={}", traceId, transcript.getId(), ex.getMessage());
                // Fallback to rule-based suggestions when AI fails
                practiceSuggestions = practiceSuggestionService.generateSuggestions(evaluated);
                response = ShadowingEvaluationResponse.immediate(
                        evaluated.getOverallScore(),
                        evaluated.getAccuracy(),
                        evaluated.getSimilarity(),
                        evaluated.getMissingWords(),
                        evaluated.getExtraWords(),
                        evaluated.getWrongWords(),
                        practiceSuggestions
                );
            }
        } else {
            // Generate rule-based suggestions when AI is not used
            practiceSuggestions = practiceSuggestionService.generateSuggestions(evaluated);
            response = ShadowingEvaluationResponse.immediate(
                    evaluated.getOverallScore(),
                    evaluated.getAccuracy(),
                    evaluated.getSimilarity(),
                    evaluated.getMissingWords(),
                    evaluated.getExtraWords(),
                    evaluated.getWrongWords(),
                    practiceSuggestions
            );
            log.info("[TRACE] id={} event=AI_FEEDBACK_SKIPPED sentenceId={} needsAI={}", traceId, transcript.getId(), evaluated.isNeedsAI());
        }

        response.setTranscript(sttResult.transcript());

        evaluationLogger.log(EvaluationLogEvent.builder()
                .studentId(studentId)
                .sentenceId(String.valueOf(transcript.getId()))
                .audioHash(audioHash)
                .audioDuration(validationResult.getDurationMs())
                .whisperLatency(whisperLatency)
                .whisperConfidence(evaluated.getConfidence())
                .similarity(evaluated.getSimilarity())
                .cer(evaluated.getCer())
                .wer(evaluated.getWer())
                .overallScore(evaluated.getOverallScore())
                .geminiCalled(evaluated.isNeedsAI())
                .cacheHit(cacheHit)
                .cacheMiss(cacheMiss)
                .evaluationDuration(System.currentTimeMillis() - pipelineStart)
                .build());

        try {
            evaluationCache.put(studentId, videoId, zeroBasedSentenceOrder, audioHash, response);
        } catch (Exception ex) {
            log.warn("[ShadowingEvaluationService] cache put failed", ex);
        }
        return response;
    }
}

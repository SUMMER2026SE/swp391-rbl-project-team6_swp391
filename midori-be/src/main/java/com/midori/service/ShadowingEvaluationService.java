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

    public ShadowingEvaluationResponse evaluateSentence(MultipartFile audioFile,
                                                        String videoId,
                                                        int sentenceOrder) {
        long pipelineStart = System.currentTimeMillis();
        String studentId = currentUserProvider.requireStudentId();
        UUID parsedVideoId = UUID.fromString(videoId);

        ShadowingTranscript transcript = shadowingTranscriptRepository.findByShadowingVideoIdOrderBySentenceOrderAsc(parsedVideoId)
                .stream()
                .filter(item -> item.getSentenceOrder() != null && item.getSentenceOrder().equals(sentenceOrder))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sentence not found"));

        String reference = transcript.getJpText();
        if (reference == null) reference = "";

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
            log.warn("[ShadowingEvaluationService] invalid audio studentId={} sentenceId={} reason={}",
                    studentId, transcript.getId(), validationResult.getReason());
            return ShadowingEvaluationResponse.validationError(validationResult.getReason());
        }

        String audioHash = audioHashGenerator.hash(audioBytes);

        boolean cacheHit = false;
        boolean cacheMiss = false;
        ShadowingEvaluationResponse cached = evaluationCache.get(studentId, videoId, sentenceOrder, audioHash);
        if (cached != null) {
            cacheHit = true;
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

        SpeechRecognitionResult sttResult;
        try {
            sttResult = speechToTextService.transcribe(audioFile);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio transcription failed: " + ex.getMessage());
        }
        long whisperLatency = System.currentTimeMillis() - pipelineStart;

        long evaluationStart = System.currentTimeMillis();
        EvaluatedSentence evaluated = pronunciationEvaluator.evaluate(reference, sttResult.transcript(), sttResult, audioHash, validationResult);
        long evaluationDuration = System.currentTimeMillis() - evaluationStart;

        ShadowingEvaluationResponse response;
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
                List<String> feedback = geminiFeedbackProvider.generateFeedback(reference, sttResult.transcript(), metrics, evaluated.getConfidence()).getFeedback();
                response = ShadowingEvaluationResponse.withAI(
                        evaluated.getOverallScore(),
                        evaluated.getAccuracy(),
                        evaluated.getSimilarity(),
                        evaluated.getMissingWords(),
                        evaluated.getExtraWords(),
                        evaluated.getWrongWords(),
                        feedback
                );
            } catch (Exception ex) {
                log.warn("[ShadowingEvaluationService] AI feedback failed, fallback to deterministic", ex);
                response = ShadowingEvaluationResponse.immediate(
                        evaluated.getOverallScore(),
                        evaluated.getAccuracy(),
                        evaluated.getSimilarity(),
                        evaluated.getMissingWords(),
                        evaluated.getExtraWords(),
                        evaluated.getWrongWords()
                );
            }
        } else {
            response = ShadowingEvaluationResponse.immediate(
                    evaluated.getOverallScore(),
                    evaluated.getAccuracy(),
                    evaluated.getSimilarity(),
                    evaluated.getMissingWords(),
                    evaluated.getExtraWords(),
                    evaluated.getWrongWords()
            );
        }

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
            evaluationCache.put(studentId, videoId, sentenceOrder, audioHash, response);
        } catch (Exception ex) {
            log.warn("[ShadowingEvaluationService] cache put failed", ex);
        }
        return response;
    }
}

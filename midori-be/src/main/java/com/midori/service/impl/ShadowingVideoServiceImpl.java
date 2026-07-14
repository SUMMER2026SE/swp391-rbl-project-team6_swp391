package com.midori.service.impl;

import com.midori.dto.shadowing.*;
import com.midori.entity.*;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.*;
import com.midori.service.ShadowingVideoService;
import com.midori.service.ShadowingAiProcessingService;
import com.midori.service.VideoStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.midori.service.TranscriptAnalyzerService;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShadowingVideoServiceImpl implements ShadowingVideoService {

    private final ShadowingVideoRepository shadowingVideoRepository;
    private final ShadowingTranscriptRepository shadowingTranscriptRepository;
    private final ShadowingProcessingLogRepository shadowingProcessingLogRepository;
    private final VideoStorageService videoStorageService;
    private final ShadowingAiProcessingService shadowingAiProcessingService;
    private final TranscriptAnalyzerService transcriptAnalyzerService;

    @Override
    @Transactional
    public ShadowingVideoUploadResponse uploadVideo(ShadowingVideoUploadRequest request) {
        log.info("[ShadowingVideo] Starting upload for title: {}", request.getTitle());

        MultipartFile videoFile = request.getVideoFile();

        if (videoFile == null || videoFile.isEmpty()) {
            log.error("[ShadowingVideo] Upload rejected: videoFile is null or empty");
            throw new BadRequestException("INVALID_FILE_TYPE");
        }

        String originalFileName = videoFile.getOriginalFilename();
        log.info("[ShadowingVideo] Calling videoStorageService.storeVideo: fileName={}, size={}",
                originalFileName, videoFile.getSize());

        VideoStorageService.VideoStorageResult storageResult =
                videoStorageService.storeVideo(videoFile, originalFileName != null ? originalFileName : "video.mp4");

        log.info("[ShadowingVideo] Storage result: publicUrl={}, storagePath={}",
                storageResult.publicUrl(), storageResult.storagePath());

        ShadowingVideo video = ShadowingVideo.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .videoUrl(storageResult.publicUrl())
                .storagePath(storageResult.storagePath())
                .status(ShadowingStatus.PROCESSING)
                .build();

        log.info("[ShadowingVideo] Saving ShadowingVideo to DB: title={}", request.getTitle());
        ShadowingVideo saved = shadowingVideoRepository.save(video);
        log.info("[ShadowingVideo] ShadowingVideo saved to DB with ID: {}", saved.getId());

        log.info("[ShadowingVideo] Triggering async AI processing for video ID: {}", saved.getId());
        shadowingAiProcessingService.processVideoAsync(saved.getId());

        log.info("[ShadowingVideo] Upload pipeline complete for video ID: {}, status: PROCESSING", saved.getId());

        return toUploadResponse(saved, "Video uploaded successfully. Processing will begin shortly.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShadowingVideoUploadResponse> getAllVideos() {
        log.info("[ShadowingVideo] Fetching all videos");
        return shadowingVideoRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(v -> toUploadResponse(v, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShadowingVideoUploadResponse getVideoById(UUID id) {
        log.info("[ShadowingVideo] Fetching video by ID: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));
        return toUploadResponse(video, null);
    }

    @Override
    @Transactional
    public void deleteVideo(UUID id) {
        log.info("[ShadowingVideo] Deleting video: {}", id);
        if (!shadowingVideoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Video not found with ID: " + id);
        }
        shadowingVideoRepository.deleteById(id);
        log.info("[ShadowingVideo] Video deleted: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShadowingVideoSummaryResponse> getCompletedVideos() {
        log.info("[ShadowingVideo] Fetching completed videos for students");
        return shadowingVideoRepository.findByStatusOrderByCreatedAtDesc(ShadowingStatus.COMPLETED)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShadowingVideoSummaryResponse getVideoSummary(UUID id) {
        log.info("[ShadowingVideo] Fetching video summary for students: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findByIdWithTranscripts(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));
        return toSummaryResponse(video);
    }

    @Override
    @Transactional(readOnly = true)
    public ShadowingTimestampsResponse getTimestamps(UUID id) {
        log.info("[ShadowingVideo] Fetching transcript timestamps for video: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findByIdWithTranscripts(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));

        List<ShadowingTranscript> transcripts = video.getTranscripts() != null
                ? video.getTranscripts()
                : List.of();

        List<ShadowingTranscriptResponse> segments = transcripts.stream()
                .map(this::toTranscriptResponse)
                .collect(Collectors.toList());

        return ShadowingTimestampsResponse.builder()
                .videoId(id)
                .segments(segments)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ShadowingTranslationResponse getTranslation(UUID id) {
        log.info("[ShadowingVideo] Fetching Vietnamese translation for video: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findByIdWithTranscripts(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));

        List<ShadowingTranscript> transcripts = video.getTranscripts() != null
                ? video.getTranscripts()
                : List.of();

        List<ShadowingTranscriptResponse> translations = transcripts.stream()
                .map(this::toTranscriptResponse)
                .collect(Collectors.toList());

        return ShadowingTranslationResponse.builder()
                .videoId(id)
                .translations(translations)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ShadowingProcessingStatusResponse getProcessingStatus(UUID id) {
        log.info("[ShadowingVideo] Fetching processing status for video: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));

        List<ShadowingProcessingLog> logs = shadowingProcessingLogRepository
                .findByShadowingVideoIdOrderByCreatedAtAsc(id);

        String currentStep = null;
        String errorMessage = null;

        if (!logs.isEmpty()) {
            ShadowingProcessingLog lastLog = logs.get(logs.size() - 1);
            currentStep = lastLog.getStep().name();
            if (lastLog.getStatus() == ProcessingStatus.FAILED) {
                errorMessage = lastLog.getErrorMessage();
            }
        }

        List<ShadowingProcessingLogResponse> logResponses = logs.stream()
                .map(this::toProcessingLogResponse)
                .collect(Collectors.toList());

        return ShadowingProcessingStatusResponse.builder()
                .id(id)
                .status(video.getStatus().name())
                .currentStep(currentStep)
                .errorMessage(errorMessage)
                .logs(logResponses)
                .updatedAt(video.getUpdatedAt())
                .build();
    }

    private ShadowingVideoUploadResponse toUploadResponse(ShadowingVideo video, String message) {
        return ShadowingVideoUploadResponse.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .videoUrl(video.getVideoUrl())
                .storagePath(video.getStoragePath())
                .duration(video.getDuration())
                .jlptLevel(video.getJlptLevel())
                .difficulty(video.getDifficulty())
                .lesson(video.getLesson())
                .topic(video.getTopic())
                .status(video.getStatus().name())
                .message(message)
                .sentenceCount(video.getTranscripts() != null ? video.getTranscripts().size() : 0)
                .createdAt(video.getCreatedAt())
                .build();
    }

    private ShadowingVideoSummaryResponse toSummaryResponse(ShadowingVideo video) {
        return ShadowingVideoSummaryResponse.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .videoUrl(video.getVideoUrl())
                .thumbnailUrl(video.getThumbnailUrl())
                .duration(video.getDuration())
                .jlptLevel(video.getJlptLevel())
                .difficulty(video.getDifficulty())
                .lesson(video.getLesson())
                .topic(video.getTopic())
                .status(video.getStatus().name())
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }

    private ShadowingTranscriptResponse toTranscriptResponse(ShadowingTranscript transcript) {
        List<TranscriptTokenResponse> tokenResponses = List.of();
        try {
            List<com.midori.entity.TranscriptToken> tokens = transcriptAnalyzerService.getTokensForSentence(transcript.getId());
            if (tokens.isEmpty()) {
                tokens = transcriptAnalyzerService.analyzeAndSave(transcript);
            }
            tokenResponses = tokens.stream()
                    .map(t -> TranscriptTokenResponse.builder()
                            .id(t.getId())
                            .surface(t.getSurface())
                            .lemma(t.getLemma())
                            .reading(t.getReading())
                            .position(t.getPosition())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to retrieve or analyze tokens for transcript {}: {}", transcript.getId(), e.getMessage());
        }

        return ShadowingTranscriptResponse.builder()
                .id(transcript.getId())
                .videoId(transcript.getShadowingVideo().getId())
                .sentenceOrder(transcript.getSentenceOrder())
                .startTime(transcript.getStartTime())
                .endTime(transcript.getEndTime())
                .jpText(transcript.getJpText())
                .vnText(transcript.getVnText())
                .tokens(tokenResponses)
                .build();
    }

    private ShadowingProcessingLogResponse toProcessingLogResponse(ShadowingProcessingLog logEntity) {
        return ShadowingProcessingLogResponse.builder()
                .id(logEntity.getId())
                .videoId(logEntity.getShadowingVideo().getId())
                .step(logEntity.getStep().name())
                .status(logEntity.getStatus().name())
                .errorMessage(logEntity.getErrorMessage())
                .createdAt(logEntity.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public ShadowingVideoUploadResponse updateVideo(UUID id, ShadowingVideoUpdateRequest request) {
        log.info("[ShadowingVideo] Updating video details for ID: {}", id);
        ShadowingVideo video = shadowingVideoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + id));
 
        if (request.getTitle() != null) video.setTitle(request.getTitle());
        if (request.getDescription() != null) video.setDescription(request.getDescription());
        if (request.getJlptLevel() != null) video.setJlptLevel(request.getJlptLevel());
        if (request.getDifficulty() != null) video.setDifficulty(request.getDifficulty());
        if (request.getLesson() != null) video.setLesson(request.getLesson());
        if (request.getTopic() != null) video.setTopic(request.getTopic());
        if (request.getStatus() != null) {
            try {
                video.setStatus(ShadowingStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("[ShadowingVideo] Invalid status received: {}", request.getStatus());
            }
        }

        if (request.getSentences() != null) {
            log.info("[ShadowingVideo] Updating transcript sentences for video ID: {}", id);
            shadowingTranscriptRepository.deleteByShadowingVideoId(id);
            java.util.List<ShadowingTranscript> transcriptList = new java.util.ArrayList<>();
            for (int i = 0; i < request.getSentences().size(); i++) {
                ShadowingTranscriptUpdateRequest stReq = request.getSentences().get(i);
                ShadowingTranscript item = ShadowingTranscript.builder()
                        .shadowingVideo(video)
                        .sentenceOrder(i)
                        .startTime(stReq.getStartTime() != null ? (int) Math.round(stReq.getStartTime()) : 0)
                        .endTime(stReq.getEndTime() != null ? (int) Math.round(stReq.getEndTime()) : 0)
                        .jpText(stReq.getJpText() != null ? stReq.getJpText().trim() : "")
                        .vnText(stReq.getVnText() != null ? stReq.getVnText().trim() : "")
                        .build();
                transcriptList.add(item);
            }
            shadowingTranscriptRepository.saveAll(transcriptList);
            try {
                transcriptAnalyzerService.analyzeVideoTranscripts(id);
            } catch (Exception e) {
                log.error("Failed to analyze transcripts on video update: {}", e.getMessage());
            }
        }

        ShadowingVideo saved = shadowingVideoRepository.save(video);
        log.info("[ShadowingVideo] Video details updated for ID: {}", saved.getId());
        return toUploadResponse(saved, "Video updated successfully");
    }
}

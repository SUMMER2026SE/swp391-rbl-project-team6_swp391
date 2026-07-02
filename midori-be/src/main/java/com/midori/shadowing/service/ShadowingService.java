package com.midori.shadowing.service;

import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.shadowing.ai.ShadowingAiService;
import com.midori.shadowing.dto.*;
import com.midori.shadowing.entities.ShadowingLesson;
import com.midori.shadowing.entities.ShadowingSentence;
import com.midori.shadowing.repository.ShadowingLessonRepository;
import com.midori.shadowing.storage.ShadowingStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class ShadowingService {

    private static final Logger log = LoggerFactory.getLogger(ShadowingService.class);
    
    private final ShadowingLessonRepository shadowingLessonRepository;
    private final ShadowingStorageService shadowingStorageService;
    private final ShadowingAiService shadowingAiService;

    // In-memory map to report AI pipeline processing progress
    private final Map<String, ProgressStatus> progressMap = new ConcurrentHashMap<>();

    /**
     * Get all shadowing lessons
     */
    public List<ShadowingGenerateResponse> getAllLessons() {
        return shadowingLessonRepository.findAll()
                .stream()
                .map(this::mapToGenerateResponse)
                .toList();
    }

    /**
     * Get details of a single shadowing lesson by ID
     */
    public ShadowingGenerateResponse getLessonById(UUID id) {
        ShadowingLesson lesson = shadowingLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shadowing lesson not found for ID: " + id));
        return mapToGenerateResponse(lesson);
    }

    /**
     * Check progress of AI generation pipeline for a specific video
     */
    public ProgressStatus getProgress(String videoId) {
        return progressMap.get(videoId);
    }

    /**
     * Synchronously execute (or retrieve from database) the AI transcribing/translating pipeline
     */
    public ShadowingGenerateResponse generateOrRetrieve(String videoId, String modelSize) {
        log.info("[ShadowingService] Generate request received for videoId: {}", videoId);
        
        // 1. Delete any existing lesson in database for this videoId to force clean regeneration
        List<ShadowingLesson> existingList = shadowingLessonRepository.findAll();
        for (ShadowingLesson lesson : existingList) {
            if (lesson.getVideoUrl() != null && lesson.getVideoUrl().contains(videoId)) {
                log.info("[ShadowingService] Found existing lesson in DB for videoId: {}. Deleting to force regeneration.", videoId);
                shadowingLessonRepository.delete(lesson);
            }
        }

        // 2. Locate stored video file
        File videoFile = shadowingStorageService.getVideoFile(videoId);
        if (videoFile == null || !videoFile.exists()) {
            throw new ResourceNotFoundException("Video file not found for ID: " + videoId);
        }

        // Initialize progress tracker in map
        progressMap.put(videoId, new ProgressStatus("PROCESSING", "Extracting audio", 15));

        // 3. Trigger sequential pipeline execution
        ShadowingLesson lesson = runPipeline(videoId, videoFile, modelSize);

        return mapToGenerateResponse(lesson);
    }

    /**
     * Run the pipeline, updating progress states.
     */
    private ShadowingLesson runPipeline(String videoId, File videoFile, String modelSize) {
        long startTime = System.currentTimeMillis();
        try {
            // Step 1: Extract Audio
            log.info("[ShadowingService] Pipeline Step 1: Audio Extraction");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Extracting audio", 25));
            File audioFile = shadowingAiService.extractAudio(videoFile);

            // Step 2: Speech Recognition
            log.info("[ShadowingService] Pipeline Step 2: Speech Recognition");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Speech recognition", 50));
            List<ShadowingAiService.WhisperSegment> whisperSegments = shadowingAiService.transcribeAudio(audioFile, modelSize);

            // Step 3: Translation
            log.info("[ShadowingService] Pipeline Step 3: Translation");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Translation", 75));
            
            List<ShadowingSentence> sentences = new ArrayList<>();
            for (int i = 0; i < whisperSegments.size(); i++) {
                ShadowingAiService.WhisperSegment ws = whisperSegments.get(i);
                
                // Gemini translate
                String translation = shadowingAiService.translateWithRetry(ws.getText());
                
                ShadowingSentence sentence = new ShadowingSentence();
                sentence.setOrderIndex(i + 1);
                sentence.setJapanese(ws.getText());
                sentence.setVietnamese(translation);
                sentence.setStartTime(ws.getStart());
                sentence.setEndTime(ws.getEnd());
                sentences.add(sentence);
            }

            // Step 4: Saving
            log.info("[ShadowingService] Pipeline Step 4: Saving");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Saving", 90));
            
            ShadowingLesson lesson = new ShadowingLesson();
            lesson.setTitle("Shadowing Lesson " + videoFile.getName());
            lesson.setVideoUrl("/api/admin/shadowing/video/" + videoId);
            lesson.setDuration(shadowingStorageService.getVideoDuration(videoFile));
            lesson.setSentences(sentences);

            ShadowingLesson saved = shadowingLessonRepository.save(lesson);

            // Cleanup temp audio file
            if (audioFile.exists() && audioFile.getName().endsWith(".mp3")) {
                audioFile.delete();
            }

            long totalTime = System.currentTimeMillis() - startTime;
            log.info("[ShadowingService] Pipeline finished successfully in {}ms", totalTime);

            // Step 5: Completed
            progressMap.put(videoId, new ProgressStatus("COMPLETED", "Completed", 100, saved));
            return saved;

        } catch (Exception e) {
            log.error("[ShadowingService] AI Pipeline failed for videoId: " + videoId, e);
            progressMap.put(videoId, new ProgressStatus("FAILED", "Completed", 100, e.getMessage()));
            throw new BadRequestException("AI pipeline failed: " + e.getMessage());
        }
    }

    /**
     * Save finalized reviewed shadowing lesson
     */
    public ShadowingLesson saveLesson(ShadowingSaveRequest request) {
        log.info("[ShadowingService] Saving final review for videoUrl: {}", request.getVideoUrl());
        ShadowingLesson lesson = null;
        
        if (request.getId() != null && !request.getId().isBlank()) {
            try {
                lesson = shadowingLessonRepository.findById(UUID.fromString(request.getId())).orElse(null);
            } catch (IllegalArgumentException e) {
                log.warn("[ShadowingService] Invalid UUID format: {}", request.getId());
            }
        }

        if (lesson == null) {
            // Find by matching videoUrl
            List<ShadowingLesson> lessons = shadowingLessonRepository.findAll();
            for (ShadowingLesson l : lessons) {
                if (l.getVideoUrl() != null && l.getVideoUrl().equals(request.getVideoUrl())) {
                    lesson = l;
                    break;
                }
            }
        }

        String videoUrl = request.getVideoUrl();
        if (videoUrl != null && videoUrl.contains("/api/admin/shadowing/video/")) {
            String videoId = videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
            String supabaseUrl = shadowingStorageService.getSupabaseUrl(videoId);
            if (supabaseUrl != null) {
                videoUrl = supabaseUrl;
                log.info("[ShadowingService] Replaced local stream URL with Supabase URL: {}", videoUrl);
            }
        }

        if (lesson == null) {
            lesson = new ShadowingLesson();
        }
        lesson.setVideoUrl(videoUrl);

        lesson.setTitle(request.getTitle());
        if (request.getDuration() > 0) {
            lesson.setDuration(request.getDuration());
        }

        List<ShadowingSentence> sentencesList = new ArrayList<>();
        
        // Map list from sentences format
        if (request.getSentences() != null && !request.getSentences().isEmpty()) {
            for (int i = 0; i < request.getSentences().size(); i++) {
                ShadowingSentenceDto sDto = request.getSentences().get(i);
                ShadowingSentence sentence = new ShadowingSentence();
                if (sDto.getId() != null && !sDto.getId().isBlank()) {
                    try {
                        sentence.setId(UUID.fromString(sDto.getId()));
                    } catch (IllegalArgumentException ignored) {}
                }
                sentence.setOrderIndex(sDto.getOrder() > 0 ? sDto.getOrder() : i + 1);
                sentence.setJapanese(sDto.getJapanese());
                sentence.setVietnamese(sDto.getVietnamese());
                sentence.setStartTime(sDto.getStartTime());
                sentence.setEndTime(sDto.getEndTime());
                sentencesList.add(sentence);
            }
        } 
        // Map list from segments format (fallback for frontend compatibility)
        else if (request.getSegments() != null && !request.getSegments().isEmpty()) {
            for (int i = 0; i < request.getSegments().size(); i++) {
                ShadowingSegmentDto segDto = request.getSegments().get(i);
                ShadowingSentence sentence = new ShadowingSentence();
                if (segDto.getId() != null && !segDto.getId().isBlank()) {
                    try {
                        sentence.setId(UUID.fromString(segDto.getId()));
                    } catch (IllegalArgumentException ignored) {}
                }
                sentence.setOrderIndex(i + 1);
                sentence.setJapanese(segDto.getJapaneseText());
                sentence.setVietnamese(segDto.getVietnameseTranslation());
                sentence.setStartTime(segDto.getStartTime());
                sentence.setEndTime(segDto.getEndTime());
                sentencesList.add(sentence);
            }
        }

        lesson.setSentences(sentencesList);
        return shadowingLessonRepository.save(lesson);
    }

    private ShadowingGenerateResponse mapToGenerateResponse(ShadowingLesson lesson) {
        List<ShadowingSentenceDto> sentences = new ArrayList<>();
        if (lesson.getSentences() != null) {
            for (ShadowingSentence s : lesson.getSentences()) {
                ShadowingSentenceDto dto = new ShadowingSentenceDto();
                dto.setId(s.getId() != null ? s.getId().toString() : null);
                dto.setOrder(s.getOrderIndex());
                dto.setJapanese(s.getJapanese());
                dto.setVietnamese(s.getVietnamese());
                dto.setStartTime(s.getStartTime());
                dto.setEndTime(s.getEndTime());
                sentences.add(dto);
            }
        }
        return new ShadowingGenerateResponse(
                lesson.getId() != null ? lesson.getId().toString() : null,
                lesson.getTitle(),
                lesson.getVideoUrl(),
                lesson.getDuration(),
                sentences
        );
    }

    /**
     * Delete shadowing lesson by ID
     */
    public void deleteLesson(UUID id) {
        ShadowingLesson lesson = shadowingLessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shadowing lesson not found"));
        shadowingLessonRepository.delete(lesson);
        log.info("[ShadowingService] Deleted shadowing lesson with ID: {}", id);
    }

    public static class ProgressStatus {
        private String status; // PROCESSING, COMPLETED, FAILED
        private String step;
        private int progress;
        private String error;
        private Object result;

        public ProgressStatus() {}

        public ProgressStatus(String status, String step, int progress) {
            this.status = status;
            this.step = step;
            this.progress = progress;
        }

        public ProgressStatus(String status, String step, int progress, Object result) {
            this.status = status;
            this.step = step;
            this.progress = progress;
            this.result = result;
        }

        public ProgressStatus(String status, String step, int progress, String error) {
            this.status = status;
            this.step = step;
            this.progress = progress;
            this.error = error;
        }

        public String getStatus() { return status; }
        public String getStep() { return step; }
        public int getProgress() { return progress; }
        public String getError() { return error; }
        public Object getResult() { return result; }
    }
}

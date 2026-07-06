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

    // Stores upload benchmark data keyed by videoId, populated during storeVideo
    private final Map<String, ShadowingBenchmark> benchmarkMap = new ConcurrentHashMap<>();

    /**
     * Stores upload-phase benchmark data so it can be included in the pipeline summary
     * when generateOrRetrieve is called later for the same videoId.
     */
    public void recordUploadBenchmark(String videoId, ShadowingBenchmark benchmark) {
        benchmarkMap.put(videoId, benchmark);
    }

    /**
     * Get all shadowing lessons, optionally filtered by JLPT level.
     */
    public List<ShadowingGenerateResponse> getAllLessons(String level) {
        List<ShadowingLesson> all = shadowingLessonRepository.findAll();
        if (level != null && !level.isBlank()) {
            all = all.stream()
                    .filter(l -> level.equalsIgnoreCase(l.getJlptLevel()))
                    .toList();
        }
        return all.stream()
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
    public ShadowingGenerateResponse generateOrRetrieve(String videoId) {
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

        // 3. Retrieve upload benchmark recorded during the upload phase
        ShadowingBenchmark uploadBenchmark = benchmarkMap.remove(videoId);

        // 4. Trigger sequential pipeline execution
        ShadowingLesson lesson = runPipeline(videoId, videoFile, uploadBenchmark);

        return mapToGenerateResponse(lesson);
    }

    /**
     * Run the pipeline, updating progress states.
     */
    private ShadowingLesson runPipeline(String videoId, File videoFile, ShadowingBenchmark uploadBenchmark) {
        progressMap.put(videoId, new ProgressStatus("PROCESSING", "Extracting audio", 15));

        // Get video info
        double rawDuration = shadowingStorageService.getVideoDuration(videoFile);
        long videoDuration = (long) rawDuration;
        log.info("[Pipeline Benchmark] Video: {} | Duration: {}s | Whisper Model: {} | Device: auto (cuda/int8/float16)",
                 videoFile.getName(), videoDuration, shadowingAiService.getGroqWhisperModel());

        try {
            // Step 1: Extract Audio
            long audioStart = System.currentTimeMillis();
            log.info("[ShadowingService] Pipeline Step 1: Audio Extraction");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Extracting audio", 25));
            File audioFile = shadowingAiService.extractAudio(videoFile, videoDuration);
            long audioTime = System.currentTimeMillis() - audioStart;
            log.info("[Pipeline Benchmark] [1/6] Audio Extraction: {}ms", audioTime);

            // Step 2: Speech Recognition (model loading + transcription)
            long whisperStart = System.currentTimeMillis();
            log.info("[ShadowingService] Pipeline Step 2: Speech Recognition");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Speech recognition", 50));
            ShadowingAiService.WhisperResult whisperResult = shadowingAiService.transcribeAudioWithTiming(audioFile);
            long whisperTime = System.currentTimeMillis() - whisperStart;
            List<ShadowingAiService.WhisperSegment> whisperSegments = whisperResult.segments;
            log.info("[Pipeline Benchmark] [2/6] Whisper (load+transcribe): {}ms | Segments: {}",
                     whisperTime, whisperSegments.size());

            // Guard: Whisper must return meaningful segments for a 6-minute video
            if (whisperSegments.isEmpty()) {
                throw new BadRequestException(
                    "AI transcription returned 0 sentences. The video may have no detectable audio. " +
                    "Please ensure the video contains clear Japanese speech."
                );
            }
            if (whisperSegments.size() == 1) {
                String singleText = whisperSegments.get(0).getText();
                if (singleText == null || singleText.trim().length() < 5 || singleText.startsWith("Error:")) {
                    throw new BadRequestException(
                        "AI transcription failed: received only 1 segment with text \"" + singleText + "\". " +
                        "This usually means: (1) audio extraction failed, (2) video has no audio track, or " +
                        "(3) Whisper could not detect speech. Please check the video file."
                    );
                }
            }
            // For a 6-minute video, expect at least 10 segments
            if (whisperSegments.size() < 10) {
                log.warn("[ShadowingService] Only {} Whisper segments for video of {}s duration. Results may be sparse.",
                         whisperSegments.size(), videoDuration);
            }

            // Step 3: Translation (BATCH - all segments in one API call)
            long translationStart = System.currentTimeMillis();
            log.info("[ShadowingService] Pipeline Step 3: Translation");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Translation", 75));

            List<ShadowingSentence> sentences = new ArrayList<>();

            // Extract all Japanese text for batch translation
            List<String> japaneseTexts = whisperSegments.stream()
                    .map(ShadowingAiService.WhisperSegment::getText)
                    .toList();

            // Translate all segments in ONE Gemini API call (massive speedup)
            List<String> translations = shadowingAiService.translateBatchWithRetry(japaneseTexts);

            // Build sentence entities
            for (int i = 0; i < whisperSegments.size(); i++) {
                ShadowingAiService.WhisperSegment ws = whisperSegments.get(i);
                String translation = (i < translations.size()) ? translations.get(i) : ws.getText();

                ShadowingSentence sentence = new ShadowingSentence();
                sentence.setOrderIndex(i + 1);
                sentence.setJapanese(ws.getText());
                sentence.setVietnamese(translation);
                sentence.setStartTime(ws.getStart());
                sentence.setEndTime(ws.getEnd());
                sentences.add(sentence);
            }
            long translationTime = System.currentTimeMillis() - translationStart;
            log.info("[Pipeline Benchmark] [3/6] Gemini Translation: {}ms | Segments: {}", translationTime, sentences.size());

            // Step 4: Database Save
            long saveStart = System.currentTimeMillis();
            log.info("[ShadowingService] Pipeline Step 4: Saving");
            progressMap.put(videoId, new ProgressStatus("PROCESSING", "Saving", 90));

            ShadowingLesson lesson = new ShadowingLesson();
            lesson.setTitle("Shadowing Lesson " + videoFile.getName());
            lesson.setJlptLevel("N5");
            // Prefer Supabase public URL if available (video already uploaded there), fallback to local stream
            String supabaseVideoUrl = shadowingStorageService.getSupabaseUrl(videoId);
            lesson.setVideoUrl(supabaseVideoUrl != null ? supabaseVideoUrl : "/api/admin/shadowing/video/" + videoId);
            lesson.setDuration(videoDuration);
            lesson.setSentences(sentences);

            ShadowingLesson saved = shadowingLessonRepository.save(lesson);
            long saveTime = System.currentTimeMillis() - saveStart;
            log.info("[Pipeline Benchmark] [4/6] Database Save: {}ms", saveTime);

            // Cleanup temp audio file
            if (audioFile.exists() && audioFile.getName().endsWith(".mp3")) {
                audioFile.delete();
            }

            // Build full pipeline benchmark (upload + AI processing + DB save)
            ShadowingBenchmark fullBench = new ShadowingBenchmark();
            if (uploadBenchmark != null) {
                fullBench.setUploadLocalMs(uploadBenchmark.getUploadLocalMs());
                fullBench.setUploadSupabaseMs(uploadBenchmark.getUploadSupabaseMs());
            }
            fullBench.setFfmpegMs(audioTime);
            fullBench.setGroqWhisperMs(whisperTime);
            fullBench.setGeminiMs(translationTime);
            fullBench.setDbSaveMs(saveTime);

            // Unified benchmark summary
            long totalTime = fullBench.getTotalMs();
            String whisperModel = shadowingAiService.getGroqWhisperModel();
            String geminiModel = "gemini-2.5-flash";
            long videoSizeBytes = videoFile.length();
            String videoSizeFormatted = formatFileSize(videoSizeBytes);
            boolean supabaseSuccess = supabaseVideoUrl != null
                    && !supabaseVideoUrl.startsWith("/api/admin/shadowing/video/");

            log.info("========== Shadowing Pipeline Benchmark ==========");
            log.info("Video Duration       : {}s", videoDuration);
            log.info("Video Size          : {} ({} bytes)", videoSizeFormatted, videoSizeBytes);
            log.info("Whisper Model       : {}", whisperModel);
            log.info("Gemini Model        : {}", geminiModel);
            log.info("Number of Segments  : {}", sentences.size());
            log.info("----------------------------------------------");
            log.info("Upload Local        : {}", ShadowingBenchmark.fmtSec(fullBench.getUploadLocalMs()));
            log.info("Upload Supabase     : {} ({})",
                    ShadowingBenchmark.fmtSec(fullBench.getUploadSupabaseMs()),
                    supabaseSuccess ? "SUCCESS" : "FALLBACK");
            log.info("FFmpeg              : {}", ShadowingBenchmark.fmtSec(fullBench.getFfmpegMs()));
            log.info("Groq Whisper        : {}", ShadowingBenchmark.fmtSec(fullBench.getGroqWhisperMs()));
            log.info("Gemini              : {}", ShadowingBenchmark.fmtSec(fullBench.getGeminiMs()));
            log.info("Database Save       : {}", ShadowingBenchmark.fmtSec(fullBench.getDbSaveMs()));
            log.info("----------------------------------------------");
            log.info("Total Pipeline      : {}", ShadowingBenchmark.fmtSec(totalTime));
            log.info("================================================");

            // Attach benchmark to completed progress status
            ProgressStatus completedStatus = new ProgressStatus("COMPLETED", "Completed", 100, saved);
            completedStatus.setBenchmark(fullBench);
            progressMap.put(videoId, completedStatus);
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
        lesson.setTopic(request.getTopic());
        lesson.setJlptLevel(request.getJlptLevel());
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

        if (lesson.getSentences() == null) {
            lesson.setSentences(new ArrayList<>());
        } else {
            lesson.getSentences().clear();
        }
        if (sentencesList != null) {
            lesson.getSentences().addAll(sentencesList);
        }
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
        ShadowingGenerateResponse resp = new ShadowingGenerateResponse(
                lesson.getId() != null ? lesson.getId().toString() : null,
                lesson.getTitle(),
                lesson.getVideoUrl(),
                lesson.getDuration(),
                lesson.getTopic(),
                sentences
        );
        resp.setJlptLevel(lesson.getJlptLevel());
        return resp;
    }

    public void setJlptLevelOnLesson(UUID lessonId, String level) {
        shadowingLessonRepository.findById(lessonId).ifPresent(lesson -> {
            lesson.setJlptLevel(level);
            shadowingLessonRepository.save(lesson);
        });
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

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    public static class ProgressStatus {
        private String status; // PROCESSING, COMPLETED, FAILED
        private String step;
        private int progress;
        private String error;
        private Object result;
        private ShadowingBenchmark benchmark;

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

        public ShadowingBenchmark getBenchmark() { return benchmark; }
        public void setBenchmark(ShadowingBenchmark benchmark) { this.benchmark = benchmark; }
        public String getStatus() { return status; }
        public String getStep() { return step; }
        public int getProgress() { return progress; }
        public String getError() { return error; }
        public Object getResult() { return result; }
    }
}

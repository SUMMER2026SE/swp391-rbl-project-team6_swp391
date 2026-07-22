package com.midori.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.impl.GeminiFallbackException;
import com.midori.ai.impl.ModelFailure;
import com.midori.config.ShadowingSpeechConfig;
import com.midori.entity.*;
import com.midori.repository.*;
import com.midori.service.AudioMetadata;
import com.midori.service.SpeechModelSelector;
import com.midori.service.SpeechProvider;
import com.midori.service.SpeechRecognitionResult;
import com.midori.service.ShadowingAiProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShadowingAiProcessingServiceImpl implements ShadowingAiProcessingService {

    private static final ExecutorService translationExecutor = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r);
        t.setName("gemini-translator-");
        t.setDaemon(true);
        return t;
    });

    private final ShadowingVideoRepository shadowingVideoRepository;
    private final ShadowingTranscriptRepository shadowingTranscriptRepository;
    private final ShadowingProcessingLogRepository shadowingProcessingLogRepository;
    private final AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;
    private final TransactionTemplate transactionTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    private final SpeechProvider speechProvider;
    private final SpeechModelSelector speechModelSelector;
    private final ShadowingSpeechConfig speechConfig;
    private final com.midori.service.TranscriptAnalyzerService transcriptAnalyzerService;
    private final com.midori.service.GrammarDetectorService grammarDetectorService;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.api-keys:}")
    private String groqApiKeys;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String supabaseServiceRoleKey;

    @Value("${supabase.storage.videos-bucket:shadowing-videos}")
    private String supabaseVideosBucket;

    @Value("${ffmpeg.path:}")
    private String ffmpegPathConfig;

    @Value("${ffmpeg.probe-path:}")
    private String ffprobePathConfig;

    // Groq API limit is 25MB for audio file upload
    private static final long GROQ_MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;
    // Maximum recommended video size (roughly 30 minutes of 16kHz mono audio = ~60MB)
    private static final long MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024;

    private volatile String cachedFfmpegPath = null;
    private volatile String cachedFfprobePath = null;
    private volatile boolean verified = false;

    private synchronized void verifyFFmpegEnvironment() {
        if (verified) return;
        verified = true;

        String workingDir = System.getProperty("user.dir");
        String ffmpegEnv = System.getenv("FFMPEG_PATH");
        String ffprobeEnv = System.getenv("FFPROBE_PATH");

        log.info("[FFMPEG] Working directory: {}", workingDir);
        log.info("[FFMPEG] FFMPEG_PATH env: {}", ffmpegEnv != null ? ffmpegEnv : "(not set)");
        log.info("[FFMPEG] FFPROBE_PATH env: {}", ffprobeEnv != null ? ffprobeEnv : "(not set)");
        log.info("[FFMPEG] ffmpeg.path prop: {}", ffmpegPathConfig != null ? ffmpegPathConfig : "(not set)");
        log.info("[FFMPEG] ffprobe.path prop: {}", ffprobePathConfig != null ? ffprobePathConfig : "(not set)");

        cachedFfmpegPath = resolveBinary("FFmpeg", ffmpegPathConfig, ffmpegEnv, workingDir,
                "midori-be/ffmpeg/bin/ffmpeg.exe",
                "ffmpeg/bin/ffmpeg.exe");

        cachedFfprobePath = resolveBinary("FFprobe", ffprobePathConfig, ffprobeEnv, workingDir,
                "midori-be/ffmpeg/bin/ffprobe.exe",
                "ffmpeg/bin/ffprobe.exe");

        if (cachedFfmpegPath != null) {
            executeVersionCheck("FFmpeg", cachedFfmpegPath);
        } else {
            log.warn("[FFMPEG] FFmpeg NOT FOUND — pipeline will fail");
        }

        if (cachedFfprobePath != null) {
            executeVersionCheck("FFprobe", cachedFfprobePath);
        } else {
            log.warn("[FFMPEG] FFprobe NOT FOUND — ffprobe not available");
        }
    }

    private String resolveBinary(String name, String propValue, String envValue, String workingDir,
                                String... relativePaths) {
        String[] candidates = {
                propValue,
                envValue,
                workingDir + "/" + relativePaths[0],
                workingDir + "/" + relativePaths[1],
                new File(workingDir, relativePaths[0]).getAbsolutePath(),
                new File(workingDir, relativePaths[1]).getAbsolutePath()
        };

        for (String rawPath : candidates) {
            if (rawPath == null || rawPath.isBlank()) continue;
            File f = new File(rawPath);
            if (f.exists() && f.isFile()) {
                log.info("[FFMPEG] {} resolved: {} [EXISTS]", name, f.getAbsolutePath());
                return f.getAbsolutePath();
            }
        }

        String[] pathCandidates = { "ffmpeg", "ffprobe" };
        String target = pathCandidates[0];
        if (name.equals("FFprobe")) target = pathCandidates[1];
        try {
            ProcessBuilder pb = new ProcessBuilder(target, "-version");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            int code = p.waitFor();
            if (code == 0) {
                log.info("[FFMPEG] {} resolved: {} [SYSTEM PATH]", name, target);
                return target;
            }
        } catch (Exception ignored) {}
        log.warn("[FFMPEG] {} NOT FOUND", name);
        return null;
    }

    private void executeVersionCheck(String name, String binaryPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(binaryPath, "-version");
            pb.redirectErrorStream(true);
            Process p = pb.start();
            StringBuilder versionOutput = new StringBuilder();
            String line;
            int count = 0;
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                while ((line = br.readLine()) != null && count < 3) {
                    versionOutput.append(line).append("\n");
                    count++;
                }
            }
            int exitCode = p.waitFor();
            String version = versionOutput.toString().trim().replace("\n", " | ");
            if (version.length() > 120) version = version.substring(0, 117) + "...";
            log.info("[FFMPEG] {} version: exit={} | {}", name, exitCode, version);
        } catch (Exception e) {
            log.warn("[FFMPEG] {} version check failed: {}", name, e.getMessage());
        }
    }

    @Async("aiTaskExecutor")
    @Override
    public void processVideoAsync(UUID videoId) {
        long pipelineStartTime = System.currentTimeMillis();

        log.info("[PIPELINE] ==============================================");
        log.info("[PIPELINE] STARTED videoId={}", videoId);
        log.info("[PIPELINE] Start time: {}", new java.util.Date());
        log.info("[PIPELINE] ==============================================");

        // Gemini provider counter not used in main branch to preserve AI Core architecture

        ShadowingVideo video = shadowingVideoRepository.findById(videoId).orElse(null);
        if (video == null) {
            log.error("[PIPELINE] Video {} not found", videoId);
            return;
        }
        if (video.getStatus() == ShadowingStatus.COMPLETED) {
            log.info("[PIPELINE] Video {} is already processed (COMPLETED). Skipping.", videoId);
            return;
        }

        verifyFFmpegEnvironment();

        String effectiveKey = (groqApiKey != null && !groqApiKey.isBlank()) ? groqApiKey : groqApiKeys;
        if (effectiveKey == null || effectiveKey.isBlank()) {
            log.error("[PIPELINE] GROQ_API_KEY is not configured.");
            writeLog(videoId, null, ProcessingStep.DOWNLOAD_VIDEO, ProcessingStatus.FAILED,
                    "GROQ_API_KEY is not configured. Cannot proceed with transcription.");
            markVideoFailed(videoId);
            return;
        }

        if (cachedFfmpegPath == null) {
            log.error("[PIPELINE] FFmpeg binary NOT FOUND.");
            writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.FAILED,
                    "FFmpeg binary not found.");
            markVideoFailed(videoId);
            return;
        }

        File[] tempVideoFileHolder = { null };
        File tempAudioFile = null;

        long downloadMs = 0;
        long ffmpegMs = 0;
        long whisperMs = 0;
        long translateMs = 0;
        long dbMs = 0;

        try {
            long stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.DOWNLOAD_VIDEO, ProcessingStatus.STARTED,
                    "Starting video download / local loading...");
            log.info("[PIPELINE] STAGE=DOWNLOAD_VIDEO");

            String url = video.getVideoUrl();
            File tempVideoFile = null;
            boolean isLocal = false;
            if (url != null && (url.startsWith("file:/") || url.startsWith("/") || url.contains(":\\") || url.contains(":/") || url.startsWith("./"))) {
                try {
                    File localFile = url.startsWith("file:") ? new File(java.net.URI.create(url)) : new File(url);
                    if (localFile.exists() && localFile.isFile()) {
                        tempVideoFile = localFile;
                        isLocal = true;
                        log.info("[PIPELINE] Video file is already available locally: {}", tempVideoFile.getAbsolutePath());
                    }
                } catch (Exception e) {
                    log.warn("[PIPELINE] Failed to parse local video path: {}", url, e);
                }
            }

            if (!isLocal) {
                tempVideoFile = File.createTempFile("shadowing_video_" + videoId + "_", ".mp4");
                tempVideoFileHolder[0] = tempVideoFile;
                final File finalVideoFile = tempVideoFile;

                log.info("[PIPELINE] Downloading video from URL: {}", url);
                restTemplate.execute(url, HttpMethod.GET, null, clientHttpResponse -> {
                    try (java.io.InputStream is = clientHttpResponse.getBody()) {
                        Files.copy(is, finalVideoFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    }
                    return null;
                });
            }

            downloadMs = System.currentTimeMillis() - stepStart;
            log.info("[PIPELINE] DOWNLOAD_VIDEO COMPLETED duration={}ms size={}MB isLocal={}",
                    downloadMs, tempVideoFile.length() / (1024 * 1024), isLocal);

            // Check video file size - warn if it might produce oversized audio
            long videoSizeMB = tempVideoFile.length() / (1024 * 1024);
            if (tempVideoFile.length() > MAX_VIDEO_SIZE_BYTES) {
                log.warn("[PIPELINE] Video file is very large ({} MB). This may cause Groq API issues. Consider using a shorter video.", videoSizeMB);
            }

            writeLog(videoId, null, ProcessingStep.DOWNLOAD_VIDEO, ProcessingStatus.COMPLETED,
                    String.format("Video loaded (isLocal=%b). Size: %d bytes. Time: %d ms",
                            isLocal, tempVideoFile.length(), downloadMs));

            // Extract and upload thumbnail from the loaded video
            extractAndUploadThumbnail(videoId, tempVideoFile, video);

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.STARTED,
                    "Extracting 16kHz mono audio with FFmpeg...");
            log.info("[PIPELINE] STAGE=EXTRACT_AUDIO");

            tempAudioFile = File.createTempFile("shadowing_audio_" + videoId + "_", ".wav");

            ProcessBuilder pb = new ProcessBuilder(
                    cachedFfmpegPath, "-y", "-i", tempVideoFile.getAbsolutePath(),
                    "-vn", "-ar", "16000", "-ac", "1", tempAudioFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String ffmpegOutput = readProcessOutput(process);
            int ffmpegExitCode = process.waitFor();

            ffmpegMs = System.currentTimeMillis() - stepStart;

            if (ffmpegExitCode != 0) {
                log.error("[PIPELINE] EXTRACT_AUDIO FAILED exitCode={} output={}", ffmpegExitCode, ffmpegOutput);
                writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.FAILED,
                        String.format("FFmpeg failed with exit code %d. Output: %s",
                                ffmpegExitCode, ffmpegOutput.substring(0, Math.min(500, ffmpegOutput.length()))));
                throw new RuntimeException("FFmpeg audio extraction failed with exit code: " + ffmpegExitCode);
            }

            if (!tempAudioFile.exists() || tempAudioFile.length() == 0) {
                writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.FAILED,
                        "FFmpeg produced empty audio file");
                throw new RuntimeException("FFmpeg produced empty audio file");
            }

            log.info("[PIPELINE] EXTRACT_AUDIO COMPLETED duration={}ms size={}MB",
                    ffmpegMs, tempAudioFile.length() / (1024 * 1024));

            // Check audio size before transcription
            long audioSizeMB = tempAudioFile.length() / (1024 * 1024);
            if (tempAudioFile.length() > GROQ_MAX_AUDIO_SIZE_BYTES) {
                log.warn("[PIPELINE] Audio file size {} MB exceeds Groq 25MB limit. Will use FFmpeg chunking.", audioSizeMB);
            }

            writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.COMPLETED,
                    String.format("Audio extracted. Size: %d bytes (%.1f MB). Time: %d ms",
                            tempAudioFile.length(), (double) tempAudioFile.length() / (1024 * 1024), ffmpegMs));

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.STARTED,
                    "Transcribing audio with Groq Whisper API...");
            log.info("[PIPELINE] STAGE=TRANSCRIBE");

            byte[] audioBytes = Files.readAllBytes(tempAudioFile.toPath());
            AudioMetadata metadata = AudioMetadata.builder()
                    .durationMs(0)
                    .mimeType("audio/wav")
                    .size(audioBytes.length)
                    .channels(1)
                    .build();

            String model = speechModelSelector.selectModel(metadata);

            // Check if audio exceeds Groq's 25MB limit and needs chunking
            SpeechRecognitionResult recognitionResult;
            if (audioBytes.length > GROQ_MAX_AUDIO_SIZE_BYTES) {
                log.warn("[PIPELINE] Audio size {} MB exceeds Groq 25MB limit. Using FFmpeg chunking.",
                        audioBytes.length / (1024 * 1024));
                writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.STARTED,
                        "Audio too large for single request. Chunking with FFmpeg...");
                recognitionResult = transcribeWithFFmpegChunking(tempAudioFile, audioBytes.length, model, videoId);
            } else {
                recognitionResult = speechProvider.transcribe(audioBytes, metadata, model);
            }

            whisperMs = System.currentTimeMillis() - stepStart;

            if (recognitionResult == null || recognitionResult.transcript() == null) {
                writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.FAILED,
                        "Speech provider returned NULL transcript");
                throw new RuntimeException("Speech provider returned NULL transcript");
            }

            List<Map<String, Object>> segments = (recognitionResult.segments() != null && !recognitionResult.segments().isEmpty())
                    ? recognitionResult.segments()
                    : parseSegments(recognitionResult.transcript());
            Double videoDuration = recognitionResult.durationSeconds();

            log.info("[PIPELINE] TRANSCRIBE COMPLETED duration={}ms segments={} audioDuration={}s provider={} model={}",
                    whisperMs, segments.size(), videoDuration != null ? String.format("%.1f", videoDuration) : "unknown", recognitionResult.provider(), recognitionResult.modelUsed());
            writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.COMPLETED,
                    String.format("Transcription completed. Segments: %d, Duration: %s s, Latency: %d ms, Provider: %s, Model: %s",
                            segments.size(),
                            videoDuration != null ? String.format("%.1f", videoDuration) : "unknown",
                            whisperMs,
                            recognitionResult.provider(),
                            recognitionResult.modelUsed()));

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.TRANSLATE, ProcessingStatus.STARTED,
                    String.format("Translating %d sentences with Gemini (single request)...", segments.size()));
            log.info("[PIPELINE] STAGE=TRANSLATE sentences={} (ONE Gemini request)", segments.size());

            List<String> jpSentences = new ArrayList<>();
            for (Map<String, Object> seg : segments) {
                String text = (String) seg.getOrDefault("text", "");
                jpSentences.add(text != null ? text.trim() : "");
            }

            // Gemini Request Counter - reset for each pipeline
            final int[] geminiRequestsCount = {0};

            // Translate ALL sentences with batching & delay to respect rate limits
            List<Map<String, String>> translations = translateWithAiCoreBatched(videoId, jpSentences, geminiRequestsCount);

            translateMs = System.currentTimeMillis() - stepStart;
            log.info("[PIPELINE] TRANSLATE COMPLETED duration={}ms translations={} GeminiRequests={}",
                    translateMs, translations.size(), geminiRequestsCount[0]);
            log.info("==============================================");
            log.info("Gemini Requests Used: {}", geminiRequestsCount[0]);
            log.info("Expected: 1");
            log.info("==============================================");
            writeLog(videoId, null, ProcessingStep.TRANSLATE, ProcessingStatus.COMPLETED,
                    String.format("AI translation completed. Segments: %d, Latency: %d ms, Gemini Requests: %d",
                            translations.size(), translateMs, geminiRequestsCount[0]));

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.SAVE_DATABASE, ProcessingStatus.STARTED,
                    String.format("Saving %d transcript segments to database...", segments.size()));
            log.info("[PIPELINE] STAGE=SAVE_DATABASE segments={}", segments.size());

            Integer finalDuration = videoDuration != null ? videoDuration.intValue() : null;
            transactionTemplate.executeWithoutResult(status -> {
                doSaveTranscriptsWithTranslations(videoId, segments, translations, finalDuration);
            });

            dbMs = System.currentTimeMillis() - stepStart;
            log.info("[PIPELINE] SAVE_DATABASE COMPLETED duration={}ms rows={}", dbMs, segments.size());
            writeLog(videoId, null, ProcessingStep.SAVE_DATABASE, ProcessingStatus.COMPLETED,
                    String.format("Database save completed. Segments: %d, Latency: %d ms",
                            segments.size(), dbMs));

            markVideoCompleted(videoId, segments.size());

            long pipelineTotalMs = System.currentTimeMillis() - pipelineStartTime;

            log.info("================================================");
            log.info("PIPELINE SUMMARY");
            log.info("================================================");
            log.info("Whisper Segments: {}", segments.size());
            log.info("Gemini Requests Used: {}", geminiRequestsCount[0]);
            log.info("Translation Time: {}ms", translateMs);
            log.info("Total Pipeline Time: {}ms", pipelineTotalMs);
            log.info("================================================");

            log.info("[PIPELINE] COMPLETE videoId={}\n" +
                            "  Breakdown:\n" +
                            "  - Download/Load: {}ms\n" +
                            "  - FFmpeg Audio: {}ms\n" +
                            "  - Groq Whisper: {}ms\n" +
                            "  - AI Translation: {}ms\n" +
                            "  - Database Save: {}ms\n" +
                            "  - Total Duration: {}ms\n" +
                            "  - Gemini Requests: {}",
                    videoId, downloadMs, ffmpegMs, whisperMs, translateMs, dbMs, pipelineTotalMs, geminiRequestsCount[0]);
            writeLog(videoId, null, ProcessingStep.COMPLETE, ProcessingStatus.COMPLETED,
                    String.format("Pipeline completed successfully. Segments processed: %d. Total time: %d ms. Gemini requests: %d", segments.size(), pipelineTotalMs, geminiRequestsCount[0]));

        } catch (Exception e) {
            long pipelineTotalMs = System.currentTimeMillis() - pipelineStartTime;
            log.error("[PIPELINE] FAILED videoId={} error={} totalTime={}ms", videoId, e.getMessage(), pipelineTotalMs, e);
            writeLog(videoId, null, ProcessingStep.COMPLETE, ProcessingStatus.FAILED,
                    String.format("Pipeline failed: %s. Total time before failure: %d ms",
                            e.getMessage(), pipelineTotalMs));
            markVideoFailed(videoId);
        } finally {
            try {
                if (tempVideoFileHolder[0] != null && tempVideoFileHolder[0].exists()) {
                    tempVideoFileHolder[0].delete();
                    log.debug("[PIPELINE] Cleaned up temp video file: {}", tempVideoFileHolder[0].getAbsolutePath());
                }
                if (tempAudioFile != null && tempAudioFile.exists()) {
                    tempAudioFile.delete();
                    log.debug("[PIPELINE] Cleaned up temp audio file: {}", tempAudioFile.getAbsolutePath());
                }
            } catch (Exception ex) {
                log.warn("[PIPELINE] Cleanup failed", ex);
            }
        }
    }

    private List<Map<String, Object>> parseSegments(String transcript) {
        if (transcript == null || transcript.isBlank()) {
            return List.of();
        }
        String[] parts = transcript.split("\\n");
        List<Map<String, Object>> segments = new ArrayList<>();
        int index = 0;
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;
            segments.add(Map.of("index", index++, "text", trimmed, "start", 0.0, "end", 0.0));
        }
        if (segments.isEmpty()) {
            segments.add(Map.of("index", 0, "text", transcript.trim(), "start", 0.0, "end", 0.0));
        }
        return segments;
    }

    /**
     * Translate Japanese sentences to Vietnamese in batches with a single request per batch
     * and a delay between batches to respect Gemini rate limits.
     *
     * @param videoId Video ID for logging
     * @param jpSentences All Japanese sentences to translate
     * @param geminiRequestsCount Counter array to track number of Gemini requests (will be incremented)
     * @return List of translations with "jp" and "vi" keys
     */
    private List<Map<String, String>> translateWithAiCoreBatched(UUID videoId, List<String> jpSentences, int[] geminiRequestsCount) {
        int batchSize = 35; // 35 sentences per batch
        List<Map<String, String>> allTranslations = new ArrayList<>();
        int total = jpSentences.size();
        
        if (total == 0) {
            return allTranslations;
        }

        for (int i = 0; i < total; i += batchSize) {
            List<String> batch = jpSentences.subList(i, Math.min(i + batchSize, total));
            log.info("[TRANSLATE_BATCH] Translating batch {} (sentences {}-{}) of size {}", 
                    (i / batchSize) + 1, i, Math.min(i + batchSize, total) - 1, batch.size());
            
            List<Map<String, String>> batchResult = translateBatchSingleRequest(videoId, batch, geminiRequestsCount);
            
            // Align batchResult with input batch size to prevent IndexOutOfBoundsException
            List<Map<String, String>> alignedBatchResult = new ArrayList<>();
            for (int k = 0; k < batch.size(); k++) {
                String jp = batch.get(k);
                String vi = "";
                if (k < batchResult.size()) {
                    vi = batchResult.get(k).get("vi");
                }
                if (vi == null || vi.isBlank()) {
                    vi = "[Dịch lỗi hoặc thiếu]";
                }
                alignedBatchResult.add(Map.of("jp", jp, "vi", vi));
            }
            
            allTranslations.addAll(alignedBatchResult);
            
            // Add a small delay between batches if there are more batches
            if (i + batchSize < total) {
                try {
                    long delayMs = 3000; // 3 seconds delay
                    log.info("[TRANSLATE_BATCH] Sleeping for {}ms to respect RPM limits...", delayMs);
                    Thread.sleep(delayMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Translation batched execution interrupted", ie);
                }
            }
        }
        
        return allTranslations;
    }

    private String translateJpToViSingleRequest(List<String> japaneseSentences) {
        String[] sentences = japaneseSentences.toArray(new String[0]);
        String systemPrompt = "You are a professional Japanese translator. Respond ONLY with JSON.";
        
        StringBuilder sb = new StringBuilder();
        sb.append("You are a professional Japanese translator.\n\n");
        sb.append("Translate each Japanese sentence into natural Vietnamese.\n\n");
        sb.append("Rules:\n");
        sb.append("- Keep sentence order.\n");
        sb.append("- Do not merge sentences.\n");
        sb.append("- Do not split sentences.\n");
        sb.append("- Do not explain grammar.\n");
        sb.append("- Do not explain vocabulary.\n");
        sb.append("- Do not generate furigana.\n");
        sb.append("- Do not add notes.\n");
        sb.append("- Return ONLY valid JSON.\n\n");
        sb.append("IMPORTANT: Translate ALL sentences below in ONE response.\n");
        sb.append("Return a JSON array with each sentence's translation.\n\n");
        sb.append("Input sentences (").append(sentences.length).append(" total):\n");
        for (int i = 0; i < sentences.length; i++) {
            sb.append(i + 1).append(". ").append(sentences[i]).append("\n");
        }
        sb.append("\nOutput format (MUST be valid JSON array):\n");
        sb.append("[\n");
        sb.append("  {\"index\":1,\"jp\":\"...\",\"vi\":\"...\"},\n");
        sb.append("  {\"index\":2,\"jp\":\"...\",\"vi\":\"...\"},\n");
        sb.append("  ...\n");
        sb.append("]\n\n");
        sb.append("Rules:\n");
        sb.append("- Translate EVERY sentence in the list\n");
        sb.append("- Keep the same order as input\n");
        sb.append("- Include the index number for each translation\n");
        sb.append("- Output ONLY the JSON array, no explanation\n");

        return aiCoreService.chatWithProvider(com.midori.ai.AiProviderType.GEMINI, systemPrompt, sb.toString(), java.util.Collections.emptyList());
    }

    /**
     * Translates a single batch of sentences using Gemini in a single API call.
     */
    private List<Map<String, String>> translateBatchSingleRequest(UUID videoId, List<String> batchSentences, int[] geminiRequestsCount) {
        try {
            // Build a single prompt with ALL sentences in this batch
            String jsonResponse = translateJpToViSingleRequest(batchSentences);
            
            // Increment Gemini request counter
            geminiRequestsCount[0]++;
            log.info("[TRANSLATE_BATCH_SINGLE] Gemini request #{} completed", geminiRequestsCount[0]);
            
            if (jsonResponse == null || jsonResponse.isBlank()) {
                throw new RuntimeException("AI translation returned empty response");
            }

            String cleanedJson = cleanJsonResponse(jsonResponse);
            int responseLength = cleanedJson.length();
            log.info("[TRANSLATE_BATCH_SINGLE] AI Core response (cleaned): chars={}", responseLength);

            // Parse JSON response
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parsed = objectMapper.readValue(cleanedJson, List.class);

            if (parsed == null || parsed.isEmpty()) {
                throw new RuntimeException("AI returned empty translation array");
            }

            List<Map<String, String>> result = new ArrayList<>();
            boolean hasIndex = parsed.size() > 0 && parsed.get(0).containsKey("index");
            
            if (hasIndex) {
                // New format with index - sort by index and extract
                List<Map<String, Object>> sortedParsed = new ArrayList<>(parsed);
                sortedParsed.sort((a, b) -> {
                    try {
                        Number idxA = (Number) a.get("index");
                        Number idxB = (Number) b.get("index");
                        if (idxA == null) return 1;
                        if (idxB == null) return -1;
                        return Integer.compare(idxA.intValue(), idxB.intValue());
                    } catch (Exception e) {
                        return 0;
                    }
                });

                for (Map<String, Object> item : sortedParsed) {
                    String jp = (String) item.get("jp");
                    String vi = (String) item.get("vi");
                    if (jp == null || vi == null) {
                        continue;
                    }
                    result.add(Map.of("jp", jp.trim(), "vi", vi.trim()));
                }
            } else {
                // Old format without index - use directly
                for (Map<String, Object> item : parsed) {
                    String jp = (String) item.get("jp");
                    String vi = (String) item.get("vi");
                    if (jp == null || vi == null) {
                        continue;
                    }
                    result.add(Map.of("jp", jp.trim(), "vi", vi.trim()));
                }
            }

            return result;
        } catch (Exception e) {
            log.error("[TRANSLATE_BATCH_SINGLE] Failed to translate batch: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to translate batch: " + e.getMessage(), e);
        }
    }

    private String cleanJsonResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();
        
        int firstBrace = cleaned.indexOf('{');
        int firstBracket = cleaned.indexOf('[');
        int start = -1;
        if (firstBrace >= 0 && firstBracket >= 0) {
            start = Math.min(firstBrace, firstBracket);
        } else if (firstBrace >= 0) {
            start = firstBrace;
        } else if (firstBracket >= 0) {
            start = firstBracket;
        }
        
        int lastBrace = cleaned.lastIndexOf('}');
        int lastBracket = cleaned.lastIndexOf(']');
        int end = -1;
        if (lastBrace >= 0 && lastBracket >= 0) {
            end = Math.max(lastBrace, lastBracket);
        } else if (lastBrace >= 0) {
            end = lastBrace;
        } else if (lastBracket >= 0) {
            end = lastBracket;
        }
        
        if (start >= 0 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned.trim();
    }

    @Override
    @Async("aiTaskExecutor")
    public void retryTranslationAsync(UUID videoId) {
        log.info("[PIPELINE] RETRY_TRANSLATION_STARTED videoId={}", videoId);

        ShadowingVideo video = shadowingVideoRepository.findById(videoId).orElse(null);
        if (video == null) {
            log.error("[PIPELINE] Video {} not found for retry", videoId);
            return;
        }

        List<ShadowingTranscript> transcripts = shadowingTranscriptRepository
                .findByShadowingVideoIdOrderBySentenceOrderAsc(videoId);

        if (transcripts.isEmpty()) {
            log.warn("[PIPELINE] No transcripts found for video {}. Running full pipeline instead.", videoId);
            processVideoAsync(videoId);
            return;
        }

        List<String> jpSentences = transcripts.stream()
                .map(ShadowingTranscript::getJpText)
                .toList();

        try {
            int[] geminiRequestsCount = {0};
            List<Map<String, String>> translations = translateWithAiCoreBatched(videoId, jpSentences, geminiRequestsCount);

            transactionTemplate.executeWithoutResult(status -> {
                for (int i = 0; i < transcripts.size(); i++) {
                    String viText = translations.get(i).get("vi");
                    transcripts.get(i).setVnText(viText);
                }
                shadowingTranscriptRepository.saveAll(transcripts);
                video.setStatus(ShadowingStatus.COMPLETED);
                shadowingVideoRepository.save(video);
                log.info("[PIPELINE] RETRY_TRANSLATION_COMPLETED videoId={} translations={}", videoId, translations.size());
            });
        } catch (Exception e) {
            log.error("[PIPELINE] RETRY_TRANSLATION_FAILED videoId={} error={}", videoId, e.getMessage(), e);
            writeLog(videoId, video, ProcessingStep.TRANSLATE, ProcessingStatus.FAILED,
                    "Retry translation failed: " + e.getMessage());
            markVideoFailed(videoId);
        }
    }

    private void markVideoCompleted(UUID videoId, int segmentCount) {
        try {
            ShadowingVideo video = shadowingVideoRepository.findById(videoId).orElse(null);
            if (video != null) {
                video.setStatus(ShadowingStatus.COMPLETED);
                shadowingVideoRepository.save(video);
                log.info("[PIPELINE] Video {} marked COMPLETED with {} segments", videoId, segmentCount);
            }
        } catch (Exception e) {
            log.error("[PIPELINE] Failed to mark video {} as completed", videoId, e);
        }
    }

    private void markVideoFailed(UUID videoId) {
        try {
            ShadowingVideo video = shadowingVideoRepository.findById(videoId).orElse(null);
            if (video != null) {
                video.setStatus(ShadowingStatus.FAILED);
                shadowingVideoRepository.save(video);
                log.info("[PIPELINE] Video {} marked FAILED", videoId);
            }
        } catch (Exception e) {
            log.error("[PIPELINE] Failed to mark video {} as failed", videoId, e);
        }
    }

    private String videoUrl(UUID videoId) {
        ShadowingVideo video = shadowingVideoRepository.findById(videoId).orElse(null);
        if (video == null) {
            throw new RuntimeException("Video not found: " + videoId);
        }
        return video.getVideoUrl();
    }

    private void doSaveTranscriptsWithTranslations(UUID videoId, List<Map<String, Object>> segments,
            List<Map<String, String>> translations, Integer videoDuration) {
        ShadowingVideo video = shadowingVideoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoId));
        shadowingTranscriptRepository.deleteByShadowingVideoId(videoId);

        List<ShadowingTranscript> transcriptList = new ArrayList<>();
        for (int i = 0; i < segments.size(); i++) {
            Map<String, Object> seg = segments.get(i);
            Number startNum = (Number) seg.get("start");
            Number endNum = (Number) seg.get("end");
            String jpText = (String) seg.get("text");
            String vnText = translations.get(i).get("vi");

            ShadowingTranscript item = ShadowingTranscript.builder()
                    .shadowingVideo(video)
                    .sentenceOrder(i)
                    .startTime(startNum != null ? (int) Math.round(startNum.doubleValue()) : 0)
                    .endTime(endNum != null ? (int) Math.round(endNum.doubleValue()) : 0)
                    .jpText(jpText != null ? jpText.trim() : "")
                    .vnText(vnText != null ? vnText.trim() : "")
                    .build();
            transcriptList.add(item);
        }

        shadowingTranscriptRepository.saveAll(transcriptList);
        try {
            transcriptAnalyzerService.analyzeVideoTranscripts(videoId);
        } catch (Exception e) {
            log.error("[PIPELINE] Failed to tokenize transcripts on completion: {}", e.getMessage());
        }
        // Async grammar detection — fires after transcripts saved, never blocks pipeline
        try {
            grammarDetectorService.detectGrammar(videoId, transcriptList);
        } catch (Exception e) {
            log.warn("[PIPELINE] Grammar detection failed for videoId={}: {}", videoId, e.getMessage());
        }

        video.setStatus(ShadowingStatus.COMPLETED);
        if (videoDuration != null) {
            video.setDuration(videoDuration);
        }
        shadowingVideoRepository.save(video);

        log.info("[PIPELINE] Saved {} transcript segments", transcriptList.size());
    }

    private String readProcessOutput(Process process) {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        } catch (Exception e) {
            log.warn("[PIPELINE] Failed to read process output", e);
        }
        return output.toString();
    }

    private void writeLog(UUID videoId, ShadowingVideo video, ProcessingStep step, ProcessingStatus status, String message) {
        try {
            UUID targetVideoId = videoId;
            if (targetVideoId == null && video != null) {
                targetVideoId = video.getId();
            }
            if (targetVideoId == null) {
                log.warn("[PIPELINE] Cannot write log: both videoId and video are null");
                return;
            }
            ShadowingVideo logVideo = video;
            if (logVideo == null) {
                logVideo = shadowingVideoRepository.findById(targetVideoId).orElse(null);
            }
            if (logVideo == null) {
                log.warn("[PIPELINE] Cannot write log: video {} not found in DB", targetVideoId);
                return;
            }
            ShadowingProcessingLog logEntity = ShadowingProcessingLog.builder()
                    .shadowingVideo(logVideo)
                    .step(step)
                    .status(status)
                    .errorMessage(message)
                    .build();
            shadowingProcessingLogRepository.save(logEntity);
            log.info("[PROCESSING_LOG] step={}, status={}, message={}", step, status, message);
        } catch (Exception ex) {
            log.warn("[PIPELINE] Failed to persist processing log: {}", ex.getMessage());
        }
    }

    private String formatErrorMessage(Throwable e) {
        Throwable cause = e;
        while (cause != null && !(cause instanceof GeminiFallbackException)) {
            cause = cause.getCause();
        }

        if (cause instanceof GeminiFallbackException gfe) {
            StringBuilder sb = new StringBuilder();
            sb.append("Gemini fallback exhaustion. Details:\n");
            for (ModelFailure f : gfe.getFailures()) {
                sb.append(String.format(" - Model: %s | Status: %s | Message: %s | Response: %s\n",
                        f.getModel(),
                        f.getHttpStatus() != null ? f.getHttpStatus() : "N/A",
                        f.getErrorMessage(),
                        f.getResponseBody() != null ? truncate(f.getResponseBody(), 250) : "N/A"));
            }
            return sb.toString();
        }
        return e.getMessage();
    }

    private String truncate(String text, int max) {
        if (text == null) return "N/A";
        if (text.length() <= max) return text;
        return text.substring(0, max) + "...";
    }

    /**
     * Transcribe audio by splitting it into chunks using FFmpeg (time-based splitting)
     * and transcribing each chunk separately. This avoids the 25MB limit from Groq.
     */
    private SpeechRecognitionResult transcribeWithFFmpegChunking(File audioFile, long audioSizeBytes, 
            String model, UUID videoId) throws IOException {
        
        long startTime = System.currentTimeMillis();
        
        // 16kHz mono WAV = 32000 bytes/second
        // To stay under 25MB, max duration per chunk = 25MB / 32000 = ~781 seconds (~13 minutes)
        // Use 10 minutes per chunk to be safe
        long chunkDurationSeconds = 600; // 10 minutes
        long estimatedTotalDuration = audioSizeBytes / 32000;
        int numChunks = (int) Math.ceil((double) estimatedTotalDuration / chunkDurationSeconds);
        
        if (numChunks == 0) numChunks = 1;
        
        log.info("[PIPELINE] FFmpeg chunking: audioSize={} bytes, estimatedDuration={}s, numChunks={}, chunkDuration={}s",
                audioSizeBytes, estimatedTotalDuration, numChunks, chunkDurationSeconds);
        
        List<String> allTranscripts = new ArrayList<>();
        List<Map<String, Object>> allSegments = new ArrayList<>();
        double totalConfidence = 0;
        double totalDuration = 0;
        int successfulChunks = 0;
        
        File[] tempChunkFiles = new File[numChunks];
        
        try {
            for (int i = 0; i < numChunks; i++) {
                long startSeconds = i * chunkDurationSeconds;
                
                // Create temp file for this chunk
                File chunkFile = File.createTempFile("shadowing_chunk_" + videoId + "_", ".wav");
                tempChunkFiles[i] = chunkFile;
                
                log.info("[PIPELINE] FFmpeg chunking: extracting chunk {}/{} (start={}s, duration={}s) to {}",
                        i + 1, numChunks, startSeconds, chunkDurationSeconds, chunkFile.getAbsolutePath());
                
                // Use FFmpeg to extract this chunk (lossless segment)
                ProcessBuilder pb = new ProcessBuilder(
                        cachedFfmpegPath, "-y",
                        "-i", audioFile.getAbsolutePath(),
                        "-ss", String.valueOf(startSeconds),
                        "-t", String.valueOf(chunkDurationSeconds),
                        "-ar", "16000", "-ac", "1",
                        "-acodec", "pcm_s16le",
                        chunkFile.getAbsolutePath()
                );
                pb.redirectErrorStream(true);
                
                Process process = pb.start();
                String ffmpegOutput = readProcessOutput(process);
                int exitCode;
                try {
                    exitCode = process.waitFor();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IOException("FFmpeg chunking interrupted", e);
                }
                
                if (exitCode != 0) {
                    log.warn("[PIPELINE] FFmpeg chunk {}/{} failed with exit code {}. Output: {}",
                            i + 1, numChunks, exitCode, ffmpegOutput);
                    // Continue with other chunks
                    continue;
                }
                
                if (!chunkFile.exists() || chunkFile.length() == 0) {
                    log.warn("[PIPELINE] FFmpeg chunk {}/{} produced empty file", i + 1, numChunks);
                    continue;
                }
                
                log.info("[PIPELINE] FFmpeg chunk {}/{} created: {} bytes", 
                        i + 1, numChunks, chunkFile.length());
                
                // Transcribe this chunk
                try {
                    byte[] chunkBytes = Files.readAllBytes(chunkFile.toPath());
                    AudioMetadata chunkMetadata = AudioMetadata.builder()
                            .durationMs(chunkDurationSeconds * 1000)
                            .mimeType("audio/wav")
                            .size(chunkBytes.length)
                            .channels(1)
                            .build();
                    
                    SpeechRecognitionResult chunkResult = speechProvider.transcribe(chunkBytes, chunkMetadata, model);
                    
                    if (chunkResult != null && chunkResult.transcript() != null && !chunkResult.transcript().isBlank()) {
                        // Adjust segment timestamps to be continuous
                        for (Map<String, Object> seg : chunkResult.segments()) {
                            Map<String, Object> adjustedSeg = new HashMap<>(seg);
                            Object segStart = seg.get("start");
                            Object segEnd = seg.get("end");
                            if (segStart instanceof Number) {
                                adjustedSeg.put("start", ((Number) segStart).doubleValue() + startSeconds);
                            }
                            if (segEnd instanceof Number) {
                                adjustedSeg.put("end", ((Number) segEnd).doubleValue() + startSeconds);
                            }
                            adjustedSeg.put("index", allSegments.size());
                            allSegments.add(adjustedSeg);
                        }
                        
                        allTranscripts.add(chunkResult.transcript());
                        totalConfidence += chunkResult.confidence();
                        if (chunkResult.durationSeconds() > 0) {
                            totalDuration += chunkResult.durationSeconds();
                        }
                        successfulChunks++;
                        
                        log.info("[PIPELINE] Chunk {}/{} transcribed: {} chars",
                                i + 1, numChunks, chunkResult.transcript().length());
                    } else {
                        log.info("[PIPELINE] Chunk {}/{} returned empty transcript", i + 1, numChunks);
                    }
                } catch (Exception e) {
                    log.error("[PIPELINE] Chunk {}/{} transcription failed: {}", i + 1, numChunks, e.getMessage());
                    // Continue with other chunks
                }
                
                // Small delay between chunks to respect API rate limits
                if (i < numChunks - 1) {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
            
            if (successfulChunks == 0) {
                throw new IOException("All audio chunks failed to transcribe");
            }
            
            String mergedTranscript = String.join(" ", allTranscripts);
            double avgConfidence = totalConfidence / successfulChunks;
            
            long processingTime = System.currentTimeMillis() - startTime;
            log.info("[PIPELINE] FFmpeg chunking COMPLETED: chunks={}/{} transcriptChars={} segments={} duration={}s processingTime={}ms",
                    successfulChunks, numChunks, mergedTranscript.length(), allSegments.size(), totalDuration, processingTime);
            
            return new SpeechRecognitionResult(
                    mergedTranscript.trim(),
                    avgConfidence,
                    "ja",
                    totalDuration,
                    model,
                    "groq-chunked",
                    processingTime,
                    allSegments
            );
            
        } finally {
            // Clean up chunk files
            for (File chunkFile : tempChunkFiles) {
                if (chunkFile != null && chunkFile.exists()) {
                    if (chunkFile.delete()) {
                        log.debug("[PIPELINE] Cleaned up chunk file: {}", chunkFile.getAbsolutePath());
                    }
                }
            }
        }
    }

    private void extractAndUploadThumbnail(UUID videoId, File tempVideoFile, ShadowingVideo video) {
        log.info("[THUMBNAIL] Starting thumbnail extraction for videoId={}", videoId);
        File tempThumbFile = null;
        try {
            tempThumbFile = File.createTempFile("shadowing_thumb_" + videoId + "_", ".jpg");
            
            // Extract frame at 1 second
            ProcessBuilder pb = new ProcessBuilder(
                    cachedFfmpegPath, "-y", "-i", tempVideoFile.getAbsolutePath(),
                    "-ss", "1", "-vframes", "1", tempThumbFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output to avoid hang
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("[THUMBNAIL-FFMPEG] {}", line);
                }
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.warn("[THUMBNAIL] FFmpeg frame extraction failed with exit code: {}", exitCode);
                return;
            }
            
            log.info("[THUMBNAIL] Frame extracted to temp file: {}, size: {} bytes", 
                    tempThumbFile.getAbsolutePath(), tempThumbFile.length());
            
            // Upload to Supabase Storage
            String storagePath = "shadowing/thumbnails/" + videoId + ".jpg";
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + supabaseVideosBucket + "/" + storagePath;
            String publicUrl = supabaseUrl + "/storage/v1/object/public/" + supabaseVideosBucket + "/" + storagePath;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            headers.set("apikey", supabaseServiceRoleKey);
            if (supabaseServiceRoleKey != null && !supabaseServiceRoleKey.startsWith("sb_secret_")) {
                headers.set("Authorization", "Bearer " + supabaseServiceRoleKey);
            }
            headers.set("x-upsert", "true");
            
            byte[] fileBytes = Files.readAllBytes(tempThumbFile.toPath());
            HttpEntity<byte[]> request = new HttpEntity<>(fileBytes, headers);
            
            log.info("[THUMBNAIL] Uploading thumbnail to Supabase: {}", uploadUrl);
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.POST, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[THUMBNAIL] Upload successful! Public URL: {}", publicUrl);
                
                // Save to video entity
                transactionTemplate.executeWithoutResult(status -> {
                    ShadowingVideo currentVideo = shadowingVideoRepository.findById(videoId).orElseThrow();
                    currentVideo.setThumbnailUrl(publicUrl);
                    shadowingVideoRepository.save(currentVideo);
                });
                
                // Update in memory video object just in case it is used later
                video.setThumbnailUrl(publicUrl);
            } else {
                log.error("[THUMBNAIL] Upload failed with status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("[THUMBNAIL] Failed to extract or upload thumbnail for videoId={}", videoId, e);
        } finally {
            if (tempThumbFile != null && tempThumbFile.exists()) {
                try {
                    Files.delete(tempThumbFile.toPath());
                    log.debug("[THUMBNAIL] Deleted temp thumbnail file");
                } catch (IOException e) {
                    log.warn("[THUMBNAIL] Failed to delete temp thumbnail: {}", e.getMessage());
                }
            }
        }
    }
}

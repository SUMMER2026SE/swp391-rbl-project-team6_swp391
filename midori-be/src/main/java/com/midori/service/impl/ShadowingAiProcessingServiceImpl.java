package com.midori.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiProvider;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.impl.GeminiProvider;
import com.midori.ai.impl.GeminiFallbackException;
import com.midori.ai.impl.ModelFailure;
import com.midori.entity.*;
import com.midori.repository.*;
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

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${ffmpeg.path:}")
    private String ffmpegPathConfig;

    @Value("${ffmpeg.probe-path:}")
    private String ffprobePathConfig;

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

        // Reset Gemini request counter for this pipeline
        GeminiProvider gp = null;
        try {
            AiProvider p = aiCoreService.getCurrentProvider();
            if (p instanceof GeminiProvider) {
                gp = (GeminiProvider) p;
                gp.resetPipelineCounter();
                log.info("[PIPELINE] GeminiProvider counter RESET");
            }
        } catch (Exception e) {
            log.warn("[PIPELINE] Could not reset GeminiProvider counter: {}", e.getMessage());
        }

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

        if (groqApiKey == null || groqApiKey.isBlank()) {
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
            writeLog(videoId, null, ProcessingStep.DOWNLOAD_VIDEO, ProcessingStatus.COMPLETED,
                    String.format("Video loaded (isLocal=%b). Size: %d bytes. Time: %d ms",
                            isLocal, tempVideoFile.length(), downloadMs));

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
            writeLog(videoId, null, ProcessingStep.EXTRACT_AUDIO, ProcessingStatus.COMPLETED,
                    String.format("Audio extracted. Size: %d bytes. Time: %d ms",
                            tempAudioFile.length(), ffmpegMs));

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.STARTED,
                    "Transcribing audio with Groq Whisper API...");
            log.info("[PIPELINE] STAGE=TRANSCRIBE");

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(groqApiKey);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> whisperBody = new LinkedMultiValueMap<>();
            whisperBody.add("file", new FileSystemResource(tempAudioFile));
            whisperBody.add("model", "whisper-large-v3");
            whisperBody.add("response_format", "verbose_json");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(whisperBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> groqResponse = restTemplate.postForObject(
                    "https://api.groq.com/openai/v1/audio/transcriptions", requestEntity, Map.class
            );

            whisperMs = System.currentTimeMillis() - stepStart;

            if (groqResponse == null) {
                writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.FAILED,
                        "Groq Whisper API returned NULL response");
                throw new RuntimeException("Groq Whisper API returned NULL response");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> groqSegments = (List<Map<String, Object>>) groqResponse.get("segments");

            List<Map<String, Object>> segments;
            Double videoDuration = null;

            if (groqSegments == null) {
                String text = (String) groqResponse.get("text");
                if (text == null || text.isBlank()) {
                    writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.FAILED,
                            "Groq Whisper API returned response without 'segments' or 'text'");
                    throw new RuntimeException("Groq Whisper API returned response without 'segments' or 'text'");
                }
                log.warn("[PIPELINE] Groq returned no segments, only text. Creating synthetic segment.");
                segments = List.of(Map.of("start", 0.0, "end", 30.0, "text", text.trim()));
            } else {
                segments = groqSegments;
            }

            if (groqResponse.containsKey("duration") && groqResponse.get("duration") != null) {
                try {
                    Number durNum = (Number) groqResponse.get("duration");
                    videoDuration = durNum.doubleValue();
                } catch (Exception e) {
                    log.warn("[PIPELINE] Could not parse duration from Whisper response", e);
                }
            }

            List<String> jpSentences = new ArrayList<>();
            for (Map<String, Object> seg : segments) {
                String text = (String) seg.getOrDefault("text", "");
                jpSentences.add(text != null ? text.trim() : "");
            }

            log.info("[PIPELINE] TRANSCRIBE COMPLETED duration={}ms segments={} audioDuration={}s",
                    whisperMs, segments.size(), videoDuration != null ? String.format("%.1f", videoDuration) : "unknown");
            writeLog(videoId, null, ProcessingStep.TRANSCRIBE, ProcessingStatus.COMPLETED,
                    String.format("Transcription completed. Segments: %d, Duration: %s s, Latency: %d ms",
                            segments.size(),
                            videoDuration != null ? String.format("%.1f", videoDuration) : "unknown",
                            whisperMs));

            stepStart = System.currentTimeMillis();
            writeLog(videoId, null, ProcessingStep.TRANSLATE, ProcessingStatus.STARTED,
                    String.format("Translating %d sentences with Gemini (single request)...", jpSentences.size()));
            log.info("[PIPELINE] STAGE=TRANSLATE sentences={} (ONE Gemini request)", jpSentences.size());

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

            // Get actual Gemini request count from GeminiProvider
            int actualGeminiRequests = 0;
            if (gp != null) {
                actualGeminiRequests = gp.getPipelineRequestCount();
            }

            log.info("================================================");
            log.info("PIPELINE SUMMARY");
            log.info("================================================");
            log.info("Whisper Segments: {}", segments.size());
            log.info("Gemini Requests Used: {} (local counter: {})", geminiRequestsCount[0], actualGeminiRequests);
            log.info("Translation Time: {}ms", translateMs);
            log.info("Total Pipeline Time: {}ms", pipelineTotalMs);
            log.info("================================================");

            if (geminiRequestsCount[0] > 1 || actualGeminiRequests > 1) {
                log.warn("BUG DETECTED: Gemini was called MORE THAN ONCE!");
                log.warn("  File: ShadowingAiProcessingServiceImpl.java");
                log.warn("  Method: translateWithAiCoreSingleRequest()");
                log.warn("  Reason: Gemini was called {} times (expected 1)", Math.max(geminiRequestsCount[0], actualGeminiRequests));
            } else {
                log.info("Single Gemini request confirmed.");
            }

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

    /**
     * Translates a single batch of sentences using Gemini in a single API call.
     */
    private List<Map<String, String>> translateBatchSingleRequest(UUID videoId, List<String> batchSentences, int[] geminiRequestsCount) {
        try {
            // Build a single prompt with ALL sentences in this batch
            String jsonResponse = aiCoreService.translateJpToViSingleRequest(batchSentences);
            
            // Increment Gemini request counter
            geminiRequestsCount[0]++;
            log.info("[TRANSLATE_BATCH_SINGLE] Gemini request #{} completed", geminiRequestsCount[0]);
            
            if (jsonResponse == null || jsonResponse.isBlank()) {
                throw new RuntimeException("AI translation returned empty response");
            }

            int responseLength = jsonResponse.length();
            log.info("[TRANSLATE_BATCH_SINGLE] AI Core response: chars={}", responseLength);

            // Parse JSON response
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parsed = objectMapper.readValue(jsonResponse, List.class);

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
}

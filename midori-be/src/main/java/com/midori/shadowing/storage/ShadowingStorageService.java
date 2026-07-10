package com.midori.shadowing.storage;

import com.midori.exception.BadRequestException;
import com.midori.shadowing.dto.ShadowingBenchmark;
import com.midori.shadowing.dto.ShadowingUploadResponse;
import com.midori.shadowing.entities.PendingVideoUpload;
import com.midori.shadowing.repository.PendingVideoUploadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ShadowingStorageService {

    private static final Logger log = LoggerFactory.getLogger(ShadowingStorageService.class);
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("mp4", "mov", "mkv", "avi", "webm");

    private final PendingVideoUploadRepository pendingVideoUploadRepository;

    private final Path uploadDir = Paths.get("uploads", "shadowing");

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket:shadowing-videos}")
    private String bucket;

    public ShadowingStorageService(PendingVideoUploadRepository pendingVideoUploadRepository) {
        this.pendingVideoUploadRepository = pendingVideoUploadRepository;
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    /**
     * Retrieve the persisted Supabase public URL for a videoId, or null if the
     * upload was never completed (or backend is configured to skip Supabase).
     * Replaces the previous in-memory ConcurrentHashMap so URLs survive server restart.
     */
    public String getSupabaseUrl(String videoId) {
        return pendingVideoUploadRepository.findByVideoId(videoId)
                .map(PendingVideoUpload::getSupabasePublicUrl)
                .orElse(null);
    }

    /**
     * Store multipart file, upload to Supabase synchronously, and return Supabase public URL.
     * The video is uploaded directly to Supabase Storage — no local temp file needed for streaming.
     * A local copy is still saved temporarily for FFmpeg/Whisper processing.
     */
    public ShadowingUploadResponse storeVideo(MultipartFile file) {
        return storeVideoWithBenchmark(file).getResponse();
    }

    /**
     * Stores the video file and measures timing for local save and Supabase upload separately.
     * Returns both the upload response and the per-step benchmark data.
     */
    public BenchmarkResult storeVideoWithBenchmark(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);

        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported video format. Allowed formats: MP4, MOV, MKV, AVI, WEBM");
        }

        String videoId = UUID.randomUUID().toString();
        String fileName = videoId + "." + extension;
        Path targetLocation = this.uploadDir.resolve(fileName);

        ShadowingBenchmark bench = new ShadowingBenchmark();

        // 1. Save locally for FFmpeg/Whisper processing
        long localStart = System.currentTimeMillis();
        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("[Storage] Failed to store local temp file: {}", fileName, e);
            throw new RuntimeException("Failed to store file " + fileName, e);
        }
        bench.setUploadLocalMs(System.currentTimeMillis() - localStart);

        // 2. Parse video duration from local file
        double duration = parseDuration(targetLocation.toFile(), extension);

        // 3. Upload directly to Supabase Storage (synchronous) and persist URL
        long supabaseStart = System.currentTimeMillis();
        String publicVideoUrl = uploadToSupabase(file, videoId, fileName);
        bench.setUploadSupabaseMs(System.currentTimeMillis() - supabaseStart);

        ShadowingUploadResponse response = new ShadowingUploadResponse(videoId, publicVideoUrl, duration);
        return new BenchmarkResult(response, bench);
    }

    /**
     * Holds both the upload response and its benchmark timings.
     */
    public static class BenchmarkResult {
        private final ShadowingUploadResponse response;
        private final ShadowingBenchmark benchmark;

        public BenchmarkResult(ShadowingUploadResponse response, ShadowingBenchmark benchmark) {
            this.response = response;
            this.benchmark = benchmark;
        }

        public ShadowingUploadResponse getResponse() { return response; }
        public ShadowingBenchmark getBenchmark() { return benchmark; }
    }

    /**
     * Upload video bytes to Supabase Storage and return the public URL.
     * If Supabase is not configured, returns the local stream URL.
     * On success, the public URL is persisted to the database (pending_video_uploads)
     * so that the mapping survives server restart.
     */
    public String uploadToSupabase(MultipartFile file, String videoId, String fileName) {
        if (supabaseUrl == null || supabaseUrl.isBlank()
                || serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("[Storage] Supabase not configured. Returning local stream URL.");
            return "/api/admin/shadowing/video/" + videoId;
        }

        String objectPath = "shadowing/" + fileName;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        // Use video-specific content type so Supabase can serve it correctly.
        String contentType = file.getContentType() != null
                ? file.getContentType()
                : "video/" + fileName.substring(fileName.lastIndexOf(".") + 1);

        log.info("[Storage] Uploading video to Supabase Storage bucket '{}': {}", bucket, objectPath);
        log.info("[Storage] Upload Content-Type: {}", contentType);

        try {
            byte[] fileBytes = file.getBytes();

            HttpHeaders headers = new HttpHeaders();
            MediaType mediaType = MediaType.parseMediaType(contentType);
            headers.setContentType(mediaType);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            headers.set("apikey", serviceRoleKey);
            headers.set("x-upsert", "true");

            HttpEntity<byte[]> request = new HttpEntity<>(fileBytes, headers);

            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(30_000);
            factory.setReadTimeout(300_000); // 5 min for large video upload

            RestTemplate restTemplate = new RestTemplate(factory);
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.POST, request, String.class);

            log.info("[Storage] Supabase Upload HTTP Status: {}", response.getStatusCode());

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
                persistSupabaseUpload(videoId, objectPath, publicUrl, contentType, fileBytes.length);
                log.info("[Storage] Supabase upload successful: {}", publicUrl);
                return publicUrl;
            } else {
                String responseBody = response.getBody() != null ? response.getBody() : "(empty)";
                log.error("[Storage] Supabase upload returned {}: {}. Falling back to local stream.",
                        response.getStatusCode(), responseBody);
            }
        } catch (Exception e) {
            log.error("[Storage] Supabase upload failed: {}. Falling back to local stream.", e.getMessage());
        }

        return "/api/admin/shadowing/video/" + videoId;
    }

    /**
     * Persist a successful Supabase upload to the database so the URL survives server restart.
     * Stores the videoId, object path, public URL, content type and size.
     */
    private void persistSupabaseUpload(String videoId, String objectPath, String publicUrl,
                                       String contentType, long sizeBytes) {
        try {
            PendingVideoUpload record = pendingVideoUploadRepository.findByVideoId(videoId)
                    .orElseGet(() -> {
                        PendingVideoUpload p = new PendingVideoUpload();
                        p.setVideoId(videoId);
                        p.setCreatedAt(Instant.now());
                        return p;
                    });
            record.setStorageObjectPath(objectPath);
            record.setSupabasePublicUrl(publicUrl);
            record.setContentType(contentType);
            record.setSizeBytes(sizeBytes);
            record.setUpdatedAt(Instant.now());
            pendingVideoUploadRepository.save(record);
        } catch (Exception e) {
            log.error("[Storage] Failed to persist Supabase upload record for videoId {}: {}",
                    videoId, e.getMessage());
        }
    }

    /**
     * Retrieve the video file by video ID
     */
    public File getVideoFile(String videoId) {
        for (String ext : ALLOWED_EXTENSIONS) {
            Path filePath = this.uploadDir.resolve(videoId + "." + ext);
            File file = filePath.toFile();
            if (file.exists()) {
                return file;
            }
        }
        return null;
    }

    /**
     * Retrieve the video file duration
     */
    public double getVideoDuration(File file) {
        String ext = getFileExtension(file.getName());
        return parseDuration(file, ext);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return null;
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Simple parser for MP4 duration or fallback estimate for other formats
     */
    private double parseDuration(File file, String extension) {
        if ("mp4".equalsIgnoreCase(extension)) {
            try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
                long fileLength = raf.length();
                long pos = 0;
                while (pos < fileLength - 8) {
                    raf.seek(pos);
                    int boxSize = raf.readInt();
                    byte[] boxType = new byte[4];
                    raf.readFully(boxType);
                    String typeStr = new String(boxType);

                    if (boxSize == 0) {
                        break;
                    }

                    if ("moov".equals(typeStr)) {
                        pos += 8;
                        continue;
                    }

                    if ("mvhd".equals(typeStr)) {
                        raf.seek(pos + 8);
                        int version = raf.read();
                        int skipBytes = (version == 1) ? 8 + 8 + 3 : 4 + 4 + 3;
                        raf.seek(pos + 8 + 1 + skipBytes);

                        int timescale = raf.readInt();
                        long duration = (version == 1) ? raf.readLong() : raf.readInt();

                        if (timescale > 0) {
                            return (double) duration / timescale;
                        }
                        break;
                    }

                    pos += boxSize > 0 ? boxSize : 8;
                }
            } catch (Exception e) {
                // Ignore and fall through to estimation
            }
        }

        // Fallback: estimate duration based on file size (assuming average bit rate of 250 KB/s)
        double estimated = (double) file.length() / (250 * 1024);
        if (estimated < 5.0) estimated = 30.0;
        if (estimated > 600.0) estimated = 600.0;
        return Math.round(estimated * 100.0) / 100.0;
    }
}

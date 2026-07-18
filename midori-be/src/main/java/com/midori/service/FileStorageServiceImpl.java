package com.midori.service;

import com.midori.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("mp3", "wav", "m4a", "ogg");
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucket;

    public FileStorageServiceImpl(
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            @Value("${supabase.storage.bucket:listening-audios}") String bucket) {
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.bucket = bucket;

        boolean urlConfigured = supabaseUrl != null && !supabaseUrl.isBlank();
        boolean keyConfigured = serviceRoleKey != null && !serviceRoleKey.isBlank();
        log.info("[FileStorage] Supabase config loaded: urlConfigured={}, keyConfigured={}, bucket={}",
                urlConfigured, keyConfigured, this.bucket);
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE_TYPE");
        }

        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new BadRequestException("SUPABASE_NOT_CONFIGURED");
        }
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new BadRequestException("SUPABASE_NOT_CONFIGURED");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE");
        }

        // Resolve extension
        String extension = null;
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }
        if (extension == null || extension.isBlank()) {
            String contentType = file.getContentType();
            if (contentType != null) {
                extension = contentTypeToExtension(contentType);
            }
        }
        if (extension == null || extension.isBlank()) {
            extension = "bin";
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("INVALID_FILE_TYPE");
        }

        // Ensure the bucket exists (auto-create on first upload). This guards
        // against the most common production setup mistake (forgetting to
        // create the bucket in Supabase Storage before pointing the app at it).
        ensureBucketExists();

        // Build object path
        String objectPath = "listening/" + UUID.randomUUID() + "." + extension;

        // Supabase bucket has a restrictive allowed_mime_types list
        // (configured to audio/*). If we forward whatever the browser
        // claims as the Content-Type, .wav files often arrive as
        // application/octet-stream which Supabase rejects with 415.
        // Always derive the content-type from the file extension so
        // we send a value Supabase is configured to accept.
        String contentType = extensionToContentType(extension);
        if (contentType == null) {
            contentType = file.getContentType();
        }
        if (contentType == null || contentType.isBlank()
                || "application/octet-stream".equalsIgnoreCase(contentType)) {
            contentType = "audio/mpeg";
        }

        // Upload to Supabase
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;
        log.info("[FileStorage] Uploading to {} (size={} bytes, contentType={})",
                uploadUrl, file.getSize(), contentType);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apikey", serviceRoleKey);
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> request;
        try {
            request = new HttpEntity<>(file.getBytes(), headers);
        } catch (IOException e) {
            log.error("[FileStorage] Failed to read uploaded bytes", e);
            throw new BadRequestException("UPLOAD_FAILED");
        }

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(uploadUrl, HttpMethod.POST, request, String.class);
        } catch (HttpClientErrorException e) {
            log.error("[FileStorage] Supabase client error: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException("UPLOAD_FAILED: " + e.getStatusCode() + " " + truncate(e.getResponseBodyAsString(), 200));
        } catch (Exception e) {
            log.error("[FileStorage] Upload failed", e);
            throw new BadRequestException("UPLOAD_FAILED");
        }

        if (response.getStatusCode().is2xxSuccessful()) {
            String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
            log.info("[FileStorage] Upload OK: {}", publicUrl);
            return publicUrl;
        } else {
            log.error("[FileStorage] Non-2xx response: status={}, body={}",
                    response.getStatusCode(), response.getBody());
            throw new BadRequestException("UPLOAD_FAILED: " + response.getStatusCode());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    /**
     * Make sure the configured bucket exists. If not, create it as a public
     * bucket. Best-effort: any failure is logged but does not throw, because
     * the user might be running against a project where the bucket already
     * exists with custom policies.
     */
    private void ensureBucketExists() {
        try {
            RestTemplate rt = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            headers.set("apikey", serviceRoleKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // GET /storage/v1/bucket/{bucket} returns 200 if it exists,
            // 404 otherwise.
            String checkUrl = supabaseUrl + "/storage/v1/bucket/" + bucket;
            ResponseEntity<String> check;
            try {
                check = rt.exchange(checkUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            } catch (HttpClientErrorException.NotFound nf) {
                check = null;
            }

            if (check != null && check.getStatusCode().is2xxSuccessful()) {
                log.debug("[FileStorage] Bucket '{}' already exists", bucket);
                return;
            }

            log.warn("[FileStorage] Bucket '{}' missing — attempting to create", bucket);
            String createUrl = supabaseUrl + "/storage/v1/bucket";
            String body = String.format(
                    "{\"name\":\"%s\",\"public\":true,\"file_size_limit\":%d,\"allowed_mime_types\":[\"audio/mpeg\",\"audio/mp3\",\"audio/wav\",\"audio/x-wav\",\"audio/mp4\",\"audio/x-m4a\",\"audio/m4a\",\"audio/ogg\"]}",
                    bucket, MAX_FILE_SIZE);
            HttpEntity<String> createReq = new HttpEntity<>(body, headers);
            ResponseEntity<String> created = rt.exchange(createUrl, HttpMethod.POST, createReq, String.class);
            log.info("[FileStorage] Bucket creation response: status={}, body={}",
                    created.getStatusCode(), created.getBody());
        } catch (Exception e) {
            log.warn("[FileStorage] ensureBucketExists failed (will continue): {}", e.getMessage());
        }
    }

    private String contentTypeToExtension(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "audio/mpeg", "audio/mp3" -> "mp3";
            case "audio/wav", "audio/x-wav" -> "wav";
            case "audio/mp4", "audio/x-m4a", "audio/m4a" -> "m4a";
            case "audio/ogg" -> "ogg";
            default -> "bin";
        };
    }

    /**
     * Map a (validated) extension to a Supabase-friendly content type.
     * Always returns an audio/* value because the bucket is configured to
     * only accept audio MIME types.
     */
    private String extensionToContentType(String extension) {
        if (extension == null) return null;
        return switch (extension.toLowerCase()) {
            case "mp3" -> "audio/mpeg";
            case "wav" -> "audio/wav";
            case "m4a" -> "audio/mp4";
            case "ogg" -> "audio/ogg";
            default -> null;
        };
    }
}

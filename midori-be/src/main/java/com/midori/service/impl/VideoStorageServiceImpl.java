package com.midori.service.impl;

import com.midori.exception.BadRequestException;
import com.midori.service.VideoStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class VideoStorageServiceImpl implements VideoStorageService {

    private static final List<String> ALLOWED_EXTENSIONS = List.of("mp4", "webm", "mov");
    private static final long MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucket;

    public VideoStorageServiceImpl(
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            @Value("${supabase.storage.videos-bucket:shadowing-videos}") String bucket) {
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.bucket = bucket;

        boolean urlConfigured = supabaseUrl != null && !supabaseUrl.isBlank();
        boolean keyConfigured = serviceRoleKey != null && !serviceRoleKey.isBlank();
        log.info("[VideoStorage] Config: urlConfigured={}, keyConfigured={}, bucket={}",
                urlConfigured, keyConfigured, this.bucket);
    }

    @Override
    public VideoStorageResult storeVideo(MultipartFile file, String fileName) {
        validateFile(file);

        log.info("[VideoStorage] storeVideo called: fileName={}, size={}, contentType={}",
                fileName, file.getSize(), file.getContentType());
        log.info("[VideoStorage] Config check: supabaseUrl={}, serviceRoleKey set={}, bucket={}",
                supabaseUrl,
                serviceRoleKey != null && !serviceRoleKey.isBlank(),
                bucket);

        String extension = extractExtension(fileName, file);
        log.info("[VideoStorage] Extension extracted: {}", extension);

        // Build storage path
        String storagePath = "shadowing/" + UUID.randomUUID() + "." + extension;
        log.info("[VideoStorage] Storage path: {}", storagePath);

        // Upload to Supabase
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + storagePath;
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + storagePath;
        log.info("[VideoStorage] Upload URL: {}", uploadUrl);
        log.info("[VideoStorage] Public URL: {}", publicUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("video/" + extension));
        headers.set("apikey", serviceRoleKey);
        if (!serviceRoleKey.startsWith("sb_secret_")) {
            headers.set("Authorization", "Bearer " + serviceRoleKey);
        }
        headers.set("x-upsert", "false");

        HttpEntity<byte[]> request;
        try {
            byte[] fileBytes = file.getBytes();
            log.info("[VideoStorage] File bytes read: {} bytes", fileBytes.length);
            request = new HttpEntity<>(fileBytes, headers);
        } catch (IOException e) {
            log.error("[VideoStorage] Failed to read file bytes", e);
            throw new BadRequestException("UPLOAD_FAILED");
        }

        RestTemplate restTemplate = new RestTemplate();
        try {
            log.info("[VideoStorage] Sending POST to Supabase Storage...");
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.POST, request, String.class);

            log.info("[VideoStorage] Response status: {}, body: {}",
                    response.getStatusCode(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[VideoStorage] Upload SUCCESS: {}", storagePath);
                return new VideoStorageResult(publicUrl, storagePath);
            } else {
                log.error("[VideoStorage] Upload FAILED with status: {}", response.getStatusCode());
                throw new BadRequestException("UPLOAD_FAILED");
            }
        } catch (Exception e) {
            log.error("[VideoStorage] Upload FAILED with exception", e);
            throw new BadRequestException("UPLOAD_FAILED");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE_TYPE");
        }

        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new BadRequestException("SUPABASE_NOT_CONFIGURED");
        }
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new BadRequestException("SUPABASE_NOT_CONFIGURED");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE");
        }

        String extension = extractExtension(file.getOriginalFilename(), file);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE");
        }
    }

    private String extractExtension(String fileName, MultipartFile file) {
        String extension = null;

        if (fileName != null && fileName.contains(".")) {
            extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        }

        if (extension == null || extension.isBlank()) {
            String contentType = file.getContentType();
            if (contentType != null) {
                extension = contentTypeToExtension(contentType);
            }
        }

        if (extension == null || extension.isBlank()) {
            extension = "mp4";
        }

        return extension;
    }

    private String contentTypeToExtension(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "video/mp4" -> "mp4";
            case "video/webm" -> "webm";
            case "video/quicktime", "video/x-msvideo" -> "mov";
            default -> "mp4";
        };
    }
}

package com.midori.service;

import com.midori.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey,
            @Value("${supabase.storage.bucket}") String bucket) {
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

        // Build object path
        String objectPath = "listening/" + UUID.randomUUID() + "." + extension;

        // Resolve content type
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        // Upload to Supabase
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set("apikey", serviceRoleKey);
        if (!serviceRoleKey.startsWith("sb_secret_")) {
            headers.set("Authorization", "Bearer " + serviceRoleKey);
        }
        headers.set("x-upsert", "false");

        HttpEntity<byte[]> request;
        try {
            request = new HttpEntity<>(file.getBytes(), headers);
        } catch (IOException e) {
            throw new BadRequestException("UPLOAD_FAILED");
        }

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(uploadUrl, HttpMethod.POST, request, String.class);
        } catch (Exception e) {
            throw new BadRequestException("UPLOAD_FAILED");
        }

        if (response.getStatusCode().is2xxSuccessful()) {
            return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
        } else {
            throw new BadRequestException("UPLOAD_FAILED");
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
}

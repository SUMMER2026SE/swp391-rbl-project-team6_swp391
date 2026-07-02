package com.midori.shadowing.controller;

import com.midori.common.ApiResponse;
import com.midori.shadowing.dto.ShadowingGenerateResponse;
import com.midori.shadowing.dto.ShadowingSaveRequest;
import com.midori.shadowing.dto.ShadowingUploadResponse;
import com.midori.shadowing.entities.ShadowingLesson;
import com.midori.shadowing.service.ShadowingService;
import com.midori.shadowing.storage.ShadowingStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpRange;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/shadowing")
@RequiredArgsConstructor
public class AdminShadowingController {

    private final ShadowingStorageService shadowingStorageService;
    private final ShadowingService shadowingService;

    /**
     * Get list of all shadowing lessons.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShadowingGenerateResponse>>> getAllShadowing() {
        List<ShadowingGenerateResponse> response = shadowingService.getAllLessons();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get details of a single shadowing lesson by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShadowingGenerateResponse>> getShadowingById(@PathVariable UUID id) {
        ShadowingGenerateResponse response = shadowingService.getLessonById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Upload a video file for shadowing. Supports MP4, MOV, MKV, AVI, and WEBM.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ShadowingUploadResponse>> uploadVideo(@RequestParam("file") MultipartFile file) {
        ShadowingUploadResponse response = shadowingStorageService.storeVideo(file);
        return ResponseEntity.ok(ApiResponse.success("Video uploaded successfully", response));
    }

    /**
     * Trigger and execute AI subtitle generation (and translation) pipeline.
     */
    @PostMapping("/{videoId}/generate")
    public ResponseEntity<ApiResponse<ShadowingGenerateResponse>> generateShadowing(
            @PathVariable String videoId,
            @RequestParam(value = "model", defaultValue = "small") String model) {
        
        ShadowingGenerateResponse response = shadowingService.generateOrRetrieve(videoId, model);
        return ResponseEntity.ok(ApiResponse.success("Subtitles generated successfully", response));
    }

    /**
     * Save/update finalized reviewed shadowing lesson version.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ShadowingLesson>> saveShadowing(@RequestBody ShadowingSaveRequest request) {
        ShadowingLesson lesson = shadowingService.saveLesson(request);
        return ResponseEntity.ok(ApiResponse.success("Shadowing lesson saved successfully", lesson));
    }

    /**
     * Delete a shadowing lesson by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteShadowing(@PathVariable java.util.UUID id) {
        shadowingService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Shadowing lesson deleted successfully", null));
    }

    /**
     * Get real-time progress state of the AI generation pipeline for a specific video ID.
     */
    @GetMapping("/{videoId}/progress")
    public ResponseEntity<ApiResponse<ShadowingService.ProgressStatus>> getProgress(@PathVariable String videoId) {
        ShadowingService.ProgressStatus status = shadowingService.getProgress(videoId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * Endpoint to stream uploaded video files.
     */
    @GetMapping("/video/{videoId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResourceRegion> streamVideo(
            @PathVariable String videoId,
            @RequestHeader HttpHeaders headers) {

        File file = shadowingStorageService.getVideoFile(videoId);
        if (file == null || !file.exists()) {
            return ResponseEntity.notFound().build();
        }

        try {
            UrlResource video = new UrlResource(file.toURI());
            ResourceRegion region = resourceRegion(video, headers);
            MediaType mediaType = MediaTypeFactory.getMediaType(video).orElse(MediaType.APPLICATION_OCTET_STREAM);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(region);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResourceRegion resourceRegion(UrlResource video, HttpHeaders headers) throws IOException {
        long contentLength = video.contentLength();
        long chunkSize = 1024 * 1024L; // 1MB chunks for smooth streaming
        List<HttpRange> ranges = headers.getRange();
        if (!ranges.isEmpty()) {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(chunkSize, end - start + 1);
            return new ResourceRegion(video, start, rangeLength);
        } else {
            return new ResourceRegion(video, 0, Math.min(chunkSize, contentLength));
        }
    }
}

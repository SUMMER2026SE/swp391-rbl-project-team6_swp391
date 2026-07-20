package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.shadowing.*;
import com.midori.service.ShadowingAiProcessingService;
import com.midori.service.ShadowingVideoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin/shadowing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Shadowing", description = "Admin endpoints for managing AI shadowing videos")
@SecurityRequirement(name = "bearerAuth")
public class ShadowingAdminController {

    private final ShadowingVideoService shadowingVideoService;
    private final ShadowingAiProcessingService shadowingAiProcessingService;

    @Operation(
            summary = "Upload shadowing video",
            description = "Uploads a video file for AI shadowing processing. The video is stored and queued for async AI processing (transcription, translation, segmentation)."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Video uploaded and queued for processing",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoUploadResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid file or missing required fields"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Forbidden — requires ADMIN role"
            )
    })
    @PostMapping(value = "/videos/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ShadowingVideoUploadResponse>> uploadVideo(
            @Parameter(description = "Video title", required = true)
            @RequestParam("title") String title,
            @Parameter(description = "Optional video description")
            @RequestParam(value = "description", required = false) String description,
            @Parameter(description = "Video file (mp4, webm, mov — max 500MB)", required = true)
            @RequestParam("video") MultipartFile videoFile) {

        log.info("[ShadowingAdmin] Upload request: title={}, fileSize={}, fileName={}",
                title, videoFile.getSize(), videoFile.getOriginalFilename());

        if (videoFile.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_FILE_TYPE"));
        }

        ShadowingVideoUploadRequest request = ShadowingVideoUploadRequest.builder()
                .title(title)
                .description(description)
                .videoFile(videoFile)
                .build();

        ShadowingVideoUploadResponse response = shadowingVideoService.uploadVideo(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Video uploaded successfully", response));
    }

    @Operation(
            summary = "List all shadowing videos",
            description = "Returns all shadowing videos regardless of processing status."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Videos retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoUploadResponse[].class))
            )
    })
    @GetMapping("/videos")
    public ResponseEntity<ApiResponse<List<ShadowingVideoUploadResponse>>> getAllVideos() {
        List<ShadowingVideoUploadResponse> videos = shadowingVideoService.getAllVideos();
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @Operation(
            summary = "Get video by ID",
            description = "Returns details for a specific shadowing video."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Video retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoUploadResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}")
    public ResponseEntity<ApiResponse<ShadowingVideoUploadResponse>> getVideoById(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingVideoUploadResponse video = shadowingVideoService.getVideoById(id);
        return ResponseEntity.ok(ApiResponse.success(video));
    }

    @Operation(
            summary = "Get AI processing status",
            description = "Returns the current AI processing status and all processing log entries for a video."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Processing status retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingProcessingStatusResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}/status")
    public ResponseEntity<ApiResponse<ShadowingProcessingStatusResponse>> getProcessingStatus(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingProcessingStatusResponse status = shadowingVideoService.getProcessingStatus(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @Operation(
            summary = "Delete shadowing video",
            description = "Permanently deletes a shadowing video and all associated transcripts and processing logs."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Video deleted successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @DeleteMapping("/videos/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVideo(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        shadowingVideoService.deleteVideo(id);
        return ResponseEntity.ok(ApiResponse.success("Video deleted successfully", null));
    }

    @Operation(
            summary = "Update shadowing video",
            description = "Updates a shadowing video's metadata and transcript sentences."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Video updated successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoUploadResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @PutMapping("/videos/{id}")
    public ResponseEntity<ApiResponse<ShadowingVideoUploadResponse>> updateVideo(
            @Parameter(description = "Video ID") @PathVariable UUID id,
            @Valid @RequestBody ShadowingVideoUpdateRequest request) {
        log.info("[ShadowingAdmin] Update request for video ID: {}", id);
        ShadowingVideoUploadResponse response = shadowingVideoService.updateVideo(id, request);
        return ResponseEntity.ok(ApiResponse.success("Video updated successfully", response));
    }

    @Operation(
            summary = "Retry translation for a video",
            description = "Retries the AI translation for a video that has Japanese text but no Vietnamese translation."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Translation retry initiated"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @PostMapping("/videos/{id}/retry-translation")
    public ResponseEntity<ApiResponse<Void>> retryTranslation(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        log.info("[ShadowingAdmin] Retry translation request for video ID: {}", id);
        shadowingAiProcessingService.retryTranslationAsync(id);
        return ResponseEntity.ok(ApiResponse.success("Translation retry initiated", null));
    }
}

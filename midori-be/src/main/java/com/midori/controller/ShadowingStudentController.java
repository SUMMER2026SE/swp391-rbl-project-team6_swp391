package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.shadowing.*;
import com.midori.service.ShadowingVideoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/shadowing")
@RequiredArgsConstructor
@Tag(name = "Student Shadowing", description = "Student endpoints for AI shadowing video practice")
public class ShadowingStudentController {

    private final ShadowingVideoService shadowingVideoService;

    @Operation(
            summary = "List shadowing videos",
            description = "Returns all completed shadowing videos available for student practice."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Videos retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoSummaryResponse[].class))
            )
    })
    @GetMapping("/videos")
    public ResponseEntity<ApiResponse<List<ShadowingVideoSummaryResponse>>> listVideos() {
        List<ShadowingVideoSummaryResponse> videos = shadowingVideoService.getCompletedVideos();
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @Operation(
            summary = "Get video details",
            description = "Returns summary details for a single shadowing video."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Video details retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingVideoSummaryResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}")
    public ResponseEntity<ApiResponse<ShadowingVideoSummaryResponse>> getVideo(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingVideoSummaryResponse video = shadowingVideoService.getVideoSummary(id);
        return ResponseEntity.ok(ApiResponse.success(video));
    }

    @Operation(
            summary = "Get transcript with timestamps",
            description = "Returns the Japanese transcript with sentence-level timestamps for a video."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Transcript retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingTimestampsResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}/transcript")
    public ResponseEntity<ApiResponse<ShadowingTimestampsResponse>> getTranscript(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingTimestampsResponse transcript = shadowingVideoService.getTimestamps(id);
        return ResponseEntity.ok(ApiResponse.success(transcript));
    }

    @Operation(
            summary = "Get timestamps",
            description = "Returns sentence-level timestamps for a video."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Timestamps retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingTimestampsResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}/timestamps")
    public ResponseEntity<ApiResponse<ShadowingTimestampsResponse>> getTimestamps(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingTimestampsResponse timestamps = shadowingVideoService.getTimestamps(id);
        return ResponseEntity.ok(ApiResponse.success(timestamps));
    }

    @Operation(
            summary = "Get Vietnamese translation",
            description = "Returns Vietnamese translations for a video's transcript segments."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Translation retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ShadowingTranslationResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Video not found"
            )
    })
    @GetMapping("/videos/{id}/translation")
    public ResponseEntity<ApiResponse<ShadowingTranslationResponse>> getTranslation(
            @Parameter(description = "Video ID") @PathVariable UUID id) {
        ShadowingTranslationResponse translation = shadowingVideoService.getTranslation(id);
        return ResponseEntity.ok(ApiResponse.success(translation));
    }
}

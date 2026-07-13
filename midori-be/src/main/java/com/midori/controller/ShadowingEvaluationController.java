package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.shadowing.ShadowingEvaluationRequest;
import com.midori.dto.shadowing.ShadowingEvaluationResponse;
import com.midori.service.ShadowingEvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student/shadowing/evaluation")
@RequiredArgsConstructor
@Tag(name = "Shadowing Evaluation", description = "Pronunciation evaluation endpoints for student shadowing")
public class ShadowingEvaluationController {

    private final ShadowingEvaluationService shadowingEvaluationService;

    @Operation(
            summary = "Evaluate student pronunciation",
            description = "Evaluates student audio against a reference sentence using Whisper STT + backend scoring, with Gemini fallback when needed.",
            parameters = {
                    @Parameter(name = "videoId", in = ParameterIn.QUERY, required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "sentenceOrder", in = ParameterIn.QUERY, required = true, schema = @Schema(type = "integer"))
            }
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Evaluation completed",
                    content = @Content(schema = @Schema(implementation = ShadowingEvaluationResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid audio or parameters"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Unauthenticated"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Sentence not found"
            )
    })
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ShadowingEvaluationResponse>> evaluate(
            @Parameter(description = "Recorded audio file") @RequestParam("audioFile") MultipartFile audioFile,
            @Parameter(description = "Video ID") @RequestParam("videoId") String videoId,
            @Parameter(description = "Sentence order") @RequestParam("sentenceOrder") Integer sentenceOrder
    ) {
        ShadowingEvaluationResponse response = shadowingEvaluationService.evaluateSentence(audioFile, videoId, sentenceOrder);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

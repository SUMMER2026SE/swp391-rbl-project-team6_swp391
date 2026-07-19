package com.midori.dto.shadowing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ShadowingEvaluationRequest {
    @NotNull(message = "videoId is required")
    private String videoId;

    @NotNull(message = "sentenceOrder is required")
    private Integer sentenceOrder;

    @NotNull(message = "audioFile is required")
    @Size(min = 1, message = "audioFile cannot be empty")
    private byte[] audioFile;

    private String contentType;

    private String originalFilename;
}

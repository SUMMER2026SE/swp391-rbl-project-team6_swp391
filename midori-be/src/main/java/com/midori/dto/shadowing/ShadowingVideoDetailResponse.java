package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingVideoDetailResponse {

    private UUID id;
    private String title;
    private String description;
    private String videoUrl;
    private String storagePath;
    private String thumbnailUrl;
    private Integer duration;
    private String status;
    private String createdAt;
    private String updatedAt;
    private java.util.List<ShadowingTranscriptResponse> transcripts;
}

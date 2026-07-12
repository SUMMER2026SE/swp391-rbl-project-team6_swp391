package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingVideoResponse {

    private UUID id;
    private String title;
    private String description;
    private String videoUrl;
    private String storagePath;
    private String thumbnailUrl;
    private Integer duration;
    private String jlptLevel;
    private String difficulty;
    private String lesson;
    private String topic;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}

package com.midori.dto.vocabulary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyDetailResponse {

    private UUID id;
    private UUID lessonId;
    private String jlptLevel;
    private Integer lessonNumber;
    private String title;
    private String description;
    private Integer estimatedMinutes;
    private String difficulty;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    private List<VocabularyItemResponse> items;
}
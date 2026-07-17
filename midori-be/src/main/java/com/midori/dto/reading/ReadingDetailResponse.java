package com.midori.dto.reading;

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
public class ReadingDetailResponse {

    private UUID id;
    private UUID lessonId;
    private String jlptLevel;
    private Integer lessonNumber;
    private String title;
    private String description;
    private String passage;
    private String vietnameseTranslation;
    private Integer estimatedMinutes;
    private String difficulty;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    private List<ReadingPassageResponse> passages;
    private List<ReadingQuestionResponse> questions;
}

package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for student saved words in flashcard reviews.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedWordResponse {
    
    private UUID id;
    private String surface;
    private String reading;
    private String dictionaryForm;
    private String meaning;
    private String context;
    private String wordType;
    private String jlptLevel;
    private String lessonId;
    private String audioUrl;
    private String notes;
    private Instant createdAt;

    // Study statistics
    private String learningStatus;
    private Boolean isDifficult;
    private Instant lastReviewedAt;
    private Instant nextReviewAt;
    private Integer reviewCount;
    private Integer correctCount;
    private Integer lapseCount;
    private Instant masteredAt;
}

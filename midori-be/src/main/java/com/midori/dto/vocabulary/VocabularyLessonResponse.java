package com.midori.dto.vocabulary;

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
public class VocabularyLessonResponse {

    private UUID id;
    private String title;
    private String description;
    private String level;
    private String topic;
    private Integer estimatedMinutes;
    private Integer wordCount;
    private Boolean isPublished;
    private UUID createdBy;
    private String teacherName;
    private Boolean ownedByMe;
    private Instant createdAt;
    private Instant updatedAt;
}

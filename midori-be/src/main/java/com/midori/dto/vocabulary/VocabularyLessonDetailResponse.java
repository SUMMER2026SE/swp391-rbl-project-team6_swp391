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
public class VocabularyLessonDetailResponse {

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
    private Instant createdAt;
    private Instant updatedAt;
    private List<VocabularyWordResponse> words;
}

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
public class ReadingPassageResponse {

    private UUID id;
    private UUID readingLessonId;
    private String title;
    private Integer passageOrder;
    private String passage;
    private String vietnameseTranslation;
    private List<ReadingQuestionResponse> questions;
    private Instant createdAt;
    private Instant updatedAt;
}

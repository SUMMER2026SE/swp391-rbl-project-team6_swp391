package com.midori.dto.lesson;

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
public class LessonResponse {

    private UUID id;
    private String level;
    private Integer lessonNumber;
    private String title;
    private String description;
    private Integer orderIndex;
    private Instant createdAt;
    private Instant updatedAt;
}

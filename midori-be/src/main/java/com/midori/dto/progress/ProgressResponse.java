package com.midori.dto.progress;

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
public class ProgressResponse {

    private UUID id;
    private String contentType;
    private UUID contentId;
    private Boolean learned;
    private Boolean mastered;
    private Boolean favorite;
    private Boolean completed;
    private Integer progressPercent;
    private Instant lastStudiedAt;
    private Instant createdAt;
    private Instant updatedAt;
}

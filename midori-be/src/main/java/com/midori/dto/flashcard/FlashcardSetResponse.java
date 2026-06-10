package com.midori.dto.flashcard;

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
public class FlashcardSetResponse {

    private UUID id;
    private String title;
    private String description;
    private String level;
    private String status;
    private String rejectReason;
    private UUID teacherId;
    private String teacherName;
    private Boolean ownedByMe;
    private Long cardCount;
    private Instant createdAt;
    private Instant updatedAt;
}

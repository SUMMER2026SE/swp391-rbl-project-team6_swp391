package com.midori.dto.flashcard;

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
public class FlashcardSetDetailResponse {

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
    private List<FlashcardCardResponse> cards;
    private Instant createdAt;
    private Instant updatedAt;
}

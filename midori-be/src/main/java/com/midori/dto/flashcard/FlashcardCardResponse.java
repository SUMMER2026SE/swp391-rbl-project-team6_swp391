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
public class FlashcardCardResponse {

    private UUID id;
    private String frontText;
    private String backText;
    private String example;
    private String hint;
    private Integer orderIndex;
    private Instant createdAt;
    private Instant updatedAt;
}

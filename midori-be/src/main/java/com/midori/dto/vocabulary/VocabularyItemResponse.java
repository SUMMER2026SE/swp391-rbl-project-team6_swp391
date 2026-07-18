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
public class VocabularyItemResponse {

    private UUID id;
    private UUID vocabularyLessonId;
    private Integer itemOrder;
    private String japanese;
    private String furigana;
    private String romaji;
    private String meaning;
    private String exampleSentence;
    private String exampleTranslation;
    private String partOfSpeech;
    private Instant createdAt;
    private Instant updatedAt;
}
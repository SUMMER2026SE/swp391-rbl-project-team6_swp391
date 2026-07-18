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
public class VocabularyFavoriteResponse {

    private UUID id;
    private UUID vocabularyItemId;
    private String japanese;
    private String furigana;
    private String romaji;
    private String meaning;
    private String exampleSentence;
    private String exampleTranslation;
    private String partOfSpeech;
    private Integer itemOrder;
    private UUID lessonId;
    private String lessonTitle;
    private Instant createdAt;
}

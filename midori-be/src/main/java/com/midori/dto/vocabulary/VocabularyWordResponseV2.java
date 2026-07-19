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
public class VocabularyWordResponseV2 {

    private UUID id;
    private UUID lessonId;
    private String word;
    private String furigana;
    private String romaji;
    private String meaning;
    private String exampleJapanese;
    private String exampleMeaning;
    private String audioUrl;
    private Integer displayOrder;
    private Instant createdAt;
    private Instant updatedAt;
}

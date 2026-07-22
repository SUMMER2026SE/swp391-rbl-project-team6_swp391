package com.midori.dto.contentlibrary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVocabularyAiDraft {

    private String title;
    private String description;
    private List<ItemDraft> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDraft {
        private String japanese;
        private String furigana;
        private String romaji;
        private String meaning;
        private String exampleSentence;
        private String exampleTranslation;
        private String partOfSpeech;
    }
}

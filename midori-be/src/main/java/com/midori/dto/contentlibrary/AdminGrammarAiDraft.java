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
public class AdminGrammarAiDraft {

    private String title;
    private String description;
    private List<ItemDraft> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDraft {
        private String grammarPoint;
        private String meaningVietnamese;
        private String meaningJapanese;
        private String explanation;
        private String exampleSentence;
        private String notes;
    }
}

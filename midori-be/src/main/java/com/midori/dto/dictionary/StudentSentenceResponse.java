package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Sentence analysis response for transcript popup.
 * Contains translation and grammar breakdown.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSentenceResponse {
    
    private String originalText;
    private String translationVi;
    private String translationEn;
    private List<VocabItem> vocabulary;
    private List<GrammarItem> grammar;
    private boolean fromCache;
    private boolean fromAi;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabItem {
        private String word;
        private String reading;
        private String meaning;
        private String jlpt;
        private boolean isHighlighted;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrammarItem {
        private String pattern;
        private String reading;
        private String meaning;
        private String explanation;
    }
}

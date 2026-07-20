package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Enhanced dictionary lookup response for student transcript popup.
 * Contains comprehensive word information with AI fallback support.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDictionaryResponse {
    
    private String surface;
    private String reading;
    private String romaji;
    private String meaningVi;
    private String meaningEn;
    private String jlpt;
    private String partOfSpeech;
    private String context;
    private List<WordExample> examples;
    private boolean fromCache;
    private boolean fromAi;
    private String aiError;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordExample {
        private String ja;
        private String vi;
        private String en;
    }
}

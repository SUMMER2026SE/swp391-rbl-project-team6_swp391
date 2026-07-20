package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Comprehensive dictionary lookup response for student transcript popup.
 * Contains full word information with grammar forms, context meaning, and audio.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryLookupResponse {
    
    // Basic Word Info
    private String surface;           // Original surface form (e.g., "行きます")
    private String dictionaryForm;    // Dictionary/lemma form (e.g., "行く")
    private String reading;           // Kana reading (e.g., "いきます")
    private String romaji;            // Romanized reading (e.g., "ikimasu")
    
    // Classification
    private String jlpt;             // JLPT level (N5, N4, N3, N2, N1)
    private String wordType;          // Part of speech (Godan Verb, Ichidan Verb, etc.)
    private String pitchAccent;       // Pitch accent pattern (e.g., "0", "1", "2", "3")
    
    // Meanings
    private List<String> meanings;            // All meanings
    private String primaryMeaning;            // First/main meaning
    private String contextMeaning;            // Meaning in the specific sentence context
    private String contextExplanation;        // Explanation of why this meaning fits context
    
    // Grammar Forms (for verbs and adjectives)
    private GrammarForms forms;
    
    // Examples
    private List<WordExample> examples;
    
    // Audio
    private String audioUrl;          // URL to audio file
    private boolean hasAudio;         // Whether audio is available
    
    // Metadata
    private boolean saved;             // Whether user has saved this word
    private String saveId;             // Flashcard ID if saved
    private boolean fromCache;         // Whether result came from cache
    private boolean fromAi;            // Whether AI was used for any part
    private String aiError;            // Error message if AI failed
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrammarForms {
        private String masu;           // ます form (e.g., "食べます")
        private String te;             // て form (e.g., "食べて")
        private String ta;             // た form (e.g., "食べた")
        private String nai;            // ない form (e.g., "食べない")
        private String potential;       // Potential form (e.g., "食べられる")
        private String passive;         // Passive form (e.g., "食べられる")
        private String causative;       // Causative form (e.g., "食べさせる")
        private String volitional;      // Volitional form (e.g., "食べよう")
        private String causalPass;      // Causative-passive (e.g., "食べさせられる")
        private String teKudasai;       // てください form
        private String tai;             // たい form (want to)
        private String taiToOmoimasu;   // たいと思います
        private String nakute;          // なくて form
        private String nakereba;        // なければならない
        private String souru;           // Verb with する (e.g., "勉强する")
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordExample {
        private String japanese;        // Japanese sentence
        private String reading;        // Kana reading
        private String vietnamese;      // Vietnamese translation
        private String english;        // English translation
        private int highlightStart;    // Start index of highlighted word
        private int highlightEnd;      // End index of highlighted word
    }
}

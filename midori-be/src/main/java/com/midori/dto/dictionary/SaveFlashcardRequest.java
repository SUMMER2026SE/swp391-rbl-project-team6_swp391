package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for saving a word to flashcards.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveFlashcardRequest {
    
    private String word;           // Surface form
    private String reading;        // Kana reading
    private String meaning;       // Primary meaning
    private String context;        // Sentence context
    private String lessonId;       // Related lesson/video ID
    private String dictionaryForm; // Dictionary form
    private String wordType;      // Part of speech
    private String jlpt;          // JLPT level
}

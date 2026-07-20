package com.midori.dto.dictionary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for dictionary lookup API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryLookupRequest {
    
    @NotBlank(message = "Word is required")
    @Size(max = 100, message = "Word must not exceed 100 characters")
    private String word;
    
    // Optional kana reading (useful for kanji with multiple readings)
    private String reading;
    
    // Optional sentence context for contextual meaning
    private String sentence;
    
    // Optional lesson/video ID for context
    private String lessonId;
    
    // Original surface form (may differ from word for conjugated forms)
    private String surface;
}

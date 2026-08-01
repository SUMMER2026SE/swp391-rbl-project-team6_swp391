package com.midori.dto.dictionary;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a student saved word's spaced repetition study progress.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedWordProgressRequest {
    
    @NotBlank
    private String result; // Enum value: AGAIN, HARD, GOOD, MASTERED
}

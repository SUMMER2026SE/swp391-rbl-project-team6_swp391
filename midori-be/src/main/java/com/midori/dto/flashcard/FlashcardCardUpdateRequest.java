package com.midori.dto.flashcard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardCardUpdateRequest {

    @Size(max = 1000, message = "Kanji must not exceed 1000 characters")
    private String frontText;

    @NotBlank(message = "Hiragana / Kana is required")
    @Size(max = 500, message = "Hiragana / Kana must not exceed 500 characters")
    private String kana;

    @NotBlank(message = "Meaning is required")
    @Size(max = 1000, message = "Meaning must not exceed 1000 characters")
    private String meaning;

    @Size(max = 2000, message = "Back text must not exceed 2000 characters")
    private String backText;

    @Size(max = 2000, message = "Example must not exceed 2000 characters")
    private String example;

    @Size(max = 500, message = "Hint must not exceed 500 characters")
    private String hint;

    private Integer orderIndex;
}

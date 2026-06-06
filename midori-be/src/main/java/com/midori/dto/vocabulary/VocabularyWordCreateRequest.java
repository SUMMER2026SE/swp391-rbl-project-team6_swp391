package com.midori.dto.vocabulary;

import jakarta.validation.constraints.Min;
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
public class VocabularyWordCreateRequest {

    @NotBlank(message = "Word is required")
    @Size(max = 255, message = "Word must not exceed 255 characters")
    private String word;

    @Size(max = 255, message = "Furigana must not exceed 255 characters")
    private String furigana;

    @Size(max = 255, message = "Romaji must not exceed 255 characters")
    private String romaji;

    @NotBlank(message = "Meaning is required")
    @Size(max = 500, message = "Meaning must not exceed 500 characters")
    private String meaning;

    private String exampleJapanese;

    private String exampleMeaning;

    @Size(max = 500, message = "Audio URL must not exceed 500 characters")
    private String audioUrl;

    @Min(value = 0, message = "Display order must be at least 0")
    private Integer displayOrder;
}

package com.midori.dto.vocabulary;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyWordUpdateRequest {

    @JsonAlias({"japanese"})
    @Size(max = 255, message = "Word must not exceed 255 characters")
    private String word;

    @JsonAlias({"reading"})
    @Size(max = 255, message = "Furigana must not exceed 255 characters")
    private String furigana;

    @Size(max = 255, message = "Romaji must not exceed 255 characters")
    private String romaji;

    @JsonAlias({"vietnamese"})
    @Size(max = 500, message = "Meaning must not exceed 500 characters")
    private String meaning;

    @JsonAlias({"example_japanese"})
    private String exampleJapanese;

    @JsonAlias({"exampleVietnamese", "example_vietnamese"})
    private String exampleMeaning;

    @JsonAlias({"audio_url"})
    @Size(max = 500, message = "Audio URL must not exceed 500 characters")
    private String audioUrl;

    @JsonAlias({"display_order"})
    @Min(value = 0, message = "Display order must be at least 0")
    private Integer displayOrder;
}

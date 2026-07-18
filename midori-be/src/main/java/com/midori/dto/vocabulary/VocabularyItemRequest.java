package com.midori.dto.vocabulary;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyItemRequest {

    private UUID id;

    @JsonProperty("itemOrder")
    @Min(value = 1, message = "Item order must be at least 1")
    @Max(value = 999, message = "Item order must not exceed 999")
    private Integer itemOrder;

    @JsonProperty("japanese")
    @NotBlank(message = "Japanese word is required")
    @Size(max = 255, message = "Japanese must not exceed 255 characters")
    private String japanese;

    @JsonProperty("furigana")
    @Size(max = 255, message = "Furigana must not exceed 255 characters")
    private String furigana;

    @JsonProperty("romaji")
    @Size(max = 255, message = "Romaji must not exceed 255 characters")
    private String romaji;

    @JsonProperty("meaning")
    @NotBlank(message = "Meaning is required")
    @Size(max = 500, message = "Meaning must not exceed 500 characters")
    private String meaning;

    @JsonProperty("exampleSentence")
    private String exampleSentence;

    @JsonProperty("exampleTranslation")
    private String exampleTranslation;

    @JsonProperty("partOfSpeech")
    @Size(max = 50, message = "Part of speech must not exceed 50 characters")
    private String partOfSpeech;
}
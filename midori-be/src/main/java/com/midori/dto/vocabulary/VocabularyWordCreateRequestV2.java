package com.midori.dto.vocabulary;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class VocabularyWordCreateRequestV2 {

    @JsonAlias({"word", "japanese"})
    @Size(max = 255, message = "Japanese must not exceed 255 characters")
    private String japanese;

    @JsonAlias({"furigana", "reading"})
    @Size(max = 255, message = "Reading must not exceed 255 characters")
    private String reading;

    @Size(max = 255, message = "Romaji must not exceed 255 characters")
    private String romaji;

    @JsonAlias({"meaning", "vietnamese"})
    @Size(max = 500, message = "Vietnamese must not exceed 500 characters")
    private String vietnamese;

    @JsonAlias({"exampleJapanese", "example_japanese"})
    private String exampleJapanese;

    @JsonAlias({"exampleMeaning", "exampleVietnamese", "example_vietnamese"})
    private String exampleVietnamese;

    @JsonAlias({"audioUrl", "audio_url"})
    @Size(max = 500, message = "Audio URL must not exceed 500 characters")
    private String audioUrl;

    @JsonAlias({"displayOrder", "display_order"})
    @Min(value = 0, message = "Display order must be at least 0")
    private Integer displayOrder;

    @JsonIgnore
    public String getWord() {
        return japanese;
    }

    @JsonIgnore
    public String getFurigana() {
        return reading;
    }

    @JsonIgnore
    public String getMeaning() {
        return vietnamese;
    }

    @JsonIgnore
    public String getExampleMeaning() {
        return exampleVietnamese;
    }

    @JsonIgnore
    @NotBlank(message = "Japanese is required")
    public String getValidatedJapanese() {
        return japanese;
    }

    @JsonIgnore
    @NotBlank(message = "Vietnamese is required")
    public String getValidatedVietnamese() {
        return vietnamese;
    }

    @JsonIgnore
    public boolean hasContent() {
        return hasText(japanese) || hasText(vietnamese) || hasText(reading)
                || hasText(romaji) || hasText(exampleJapanese) || hasText(exampleVietnamese)
                || hasText(audioUrl);
    }

    @JsonIgnore
    public boolean isValidForCreate() {
        return hasText(japanese) || hasText(vietnamese) || hasText(romaji);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}

package com.midori.dto.vocabulary;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyLessonRequest {

    @JsonProperty("jlptLevel")
    @NotBlank(message = "JLPT level is required")
    @Pattern(regexp = "^(N[1-5])$", message = "Level must be N5, N4, N3, N2, or N1")
    private String jlptLevel;

    @JsonProperty("lessonNumber")
    @NotNull(message = "Lesson number is required")
    @Min(value = 1, message = "Lesson number must be at least 1")
    @Max(value = 999, message = "Lesson number must not exceed 999")
    private Integer lessonNumber;

    @JsonProperty("title")
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("estimatedMinutes")
    @Min(value = 1, message = "Estimated minutes must be at least 1")
    @Max(value = 300, message = "Estimated minutes must not exceed 300")
    private Integer estimatedMinutes;

    @JsonProperty("difficulty")
    @jakarta.annotation.Nullable
    @Pattern(regexp = "^(EASY|MEDIUM|HARD)?$", message = "Difficulty must be EASY, MEDIUM, or HARD")
    private String difficulty;

    @JsonProperty("isActive")
    @Builder.Default
    private Boolean isActive = true;
}
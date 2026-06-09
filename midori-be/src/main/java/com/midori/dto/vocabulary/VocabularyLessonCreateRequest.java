package com.midori.dto.vocabulary;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyLessonCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @NotBlank(message = "Level is required")
    @Pattern(regexp = "^(N[1-5])$", message = "Level must be N5, N4, N3, N2, or N1")
    private String level;

    @Size(max = 100, message = "Topic must not exceed 100 characters")
    private String topic;

    @JsonAlias("estimated_minutes")
    @Min(value = 1, message = "Estimated minutes must be at least 1")
    private Integer estimatedMinutes;

    @JsonAlias("is_published")
    private Boolean isPublished;

    @Valid
    private List<VocabularyWordCreateRequest> words;
}

package com.midori.dto.vocabulary;

import jakarta.validation.constraints.Min;
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
public class VocabularyLessonUpdateRequest {

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @Pattern(regexp = "^(N[1-5])$", message = "Level must be N5, N4, N3, N2, or N1")
    private String level;

    @Size(max = 100, message = "Topic must not exceed 100 characters")
    private String topic;

    @Min(value = 1, message = "Estimated minutes must be at least 1")
    private Integer estimatedMinutes;

    private Boolean isPublished;
}

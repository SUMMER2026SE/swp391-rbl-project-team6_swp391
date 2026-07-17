package com.midori.dto.grammar;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class GrammarCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @JsonProperty("pattern")
    private String pattern;

    @JsonProperty("meaning")
    private String meaning;

    @JsonProperty("structure")
    private String structure;

    @JsonProperty("usage")
    private String usage;

    @JsonProperty("examples")
    private List<String> examples;

    @JsonProperty("exampleMeanings")
    private List<String> exampleMeanings;

    @JsonProperty("level")
    @NotBlank(message = "Level is required")
    @Pattern(regexp = "^(N[1-5])$", message = "Level must be N5, N4, N3, N2, or N1")
    private String level;

    @JsonProperty("lessonNumber")
    private Integer lessonNumber;
}

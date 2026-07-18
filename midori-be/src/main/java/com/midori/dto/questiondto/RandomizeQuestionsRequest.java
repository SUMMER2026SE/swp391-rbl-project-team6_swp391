package com.midori.dto.questiondto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class RandomizeQuestionsRequest {

    @NotBlank(message = "JLPT Level is required")
    private String level;

    @NotEmpty(message = "At least one skill must be selected")
    private List<String> skills;

    @NotEmpty(message = "At least one lesson must be selected")
    private List<Integer> lessonIds;

    @NotNull(message = "Difficulty ratios are required")
    private DifficultyRatios difficulty;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Question count must be greater than zero")
    private Integer questionCount;

    @Data
    public static class DifficultyRatios {
        @NotNull
        @Min(0)
        private Integer easy;

        @NotNull
        @Min(0)
        private Integer medium;

        @NotNull
        @Min(0)
        private Integer hard;
    }
}

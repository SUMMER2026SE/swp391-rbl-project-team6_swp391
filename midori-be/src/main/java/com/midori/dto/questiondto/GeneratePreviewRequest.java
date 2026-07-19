package com.midori.dto.questiondto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class GeneratePreviewRequest {
    @NotNull
    private String level;

    @NotEmpty
    private List<Integer> lessonIds;

    @NotEmpty
    private List<String> skills;

    @NotNull
    private DifficultyDistribution difficulty;

    @Data
    public static class DifficultyDistribution {
        @NotNull
        private Integer easy;
        @NotNull
        private Integer medium;
        @NotNull
        private Integer hard;
    }
}

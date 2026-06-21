package com.midori.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateExamRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Level is required")
    private String level;

    @NotNull(message = "Total questions is required")
    @Min(value = 1, message = "At least 1 question is required")
    private Integer totalQuestions;

    @NotNull(message = "Time limit is required")
    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimit;

    private String examMode;

    private String questionReuse;

    private Boolean randomizeAnswers;

    private List<String> lessonIds;

    private String category;

    private Integer difficultyEasy;

    private Integer difficultyMedium;

    private Integer difficultyHard;

    private List<String> classIds;
}

package com.midori.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class GenerateExamFromQuestionBankRequest {

    @NotBlank(message = "Exam title is required")
    private String examTitle;

    private String description;

    @NotBlank(message = "JLPT Level is required")
    private String jlptLevel;

    @NotEmpty(message = "At least one skill must be selected")
    private List<String> skills;

    @NotNull
    @Min(value = 0)
    private Integer easyCount;

    @NotNull
    @Min(value = 0)
    private Integer mediumCount;

    @NotNull
    @Min(value = 0)
    private Integer hardCount;
}

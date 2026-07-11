package com.midori.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ExamQuestionPayload {

    private String id;

    @NotBlank
    private String prompt;

    @NotNull
    private List<String> options;

    @NotNull
    private Integer correctAnswerIndex;

    private Integer points;

    private Integer displayOrder;
}

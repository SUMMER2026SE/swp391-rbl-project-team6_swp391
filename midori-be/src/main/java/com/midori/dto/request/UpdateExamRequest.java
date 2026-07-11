package com.midori.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

@Data
public class UpdateExamRequest {

    private String title;

    private String level;

    private Integer totalQuestions;

    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimit;

    private String status;

    private List<String> classIds;

    private String category;
}

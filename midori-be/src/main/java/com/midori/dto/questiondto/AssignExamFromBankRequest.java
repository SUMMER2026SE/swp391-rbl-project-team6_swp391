package com.midori.dto.questiondto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class AssignExamFromBankRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String instructions;

    private List<String> additionalTopicIds;

    @NotEmpty(message = "At least one class is required")
    private List<UUID> classIds;

    @NotNull(message = "Due date is required")
    private Instant dueDate;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be greater than 0")
    private Integer durationMinutes;

    @NotNull(message = "Max score is required")
    @Min(value = 1, message = "Max score must be greater than 0")
    private Integer maxScore;
}

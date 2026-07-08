package com.midori.dto.homeworkdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.Data;

@Data
public class UpdateHomeworkRequest {
    @NotBlank
    private String title;
    private String instructions;
    @NotNull
    private Instant dueDate;
    @NotNull
    private Integer maxScore;
    private Integer attempts;
    private Integer timeLimit;
    private String status;
    private java.util.List<java.util.UUID> questionIds;
}

package com.midori.dto.homeworkdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateHomeworkRequest {
    @NotNull
    private UUID classId;
    private String lessonId;
    @NotBlank
    private String title;
    private String instructions;
    @NotNull
    private Instant dueDate;
    @NotNull
    private Integer maxScore;
    private Integer attempts;
    private Integer timeLimit;
    private java.util.List<UUID> questionIds;
}

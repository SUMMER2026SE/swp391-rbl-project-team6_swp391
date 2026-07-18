package com.midori.dto.homeworkdto;

import com.midori.entity.HomeworkStatus;
import com.midori.entity.HomeworkType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ManualHomeworkRequest {
    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String level;

    @NotNull
    private HomeworkType type;

    private HomeworkStatus status;

    @NotNull
    private Integer duration;

    @Valid
    private List<ManualHomeworkQuestionRequest> questions;

    private java.util.UUID classId;
    private java.time.LocalDateTime dueDate;
}

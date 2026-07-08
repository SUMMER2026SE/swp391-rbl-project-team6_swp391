package com.midori.dto.homeworkdto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeHomeworkRequest {
    @NotNull
    private Integer score;
    private String feedback;
}

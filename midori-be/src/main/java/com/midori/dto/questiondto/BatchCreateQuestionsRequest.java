package com.midori.dto.questiondto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class BatchCreateQuestionsRequest {
    @NotEmpty(message = "Questions list must not be empty")
    @Valid
    private List<CreateTeacherQuestionRequest> questions;
}

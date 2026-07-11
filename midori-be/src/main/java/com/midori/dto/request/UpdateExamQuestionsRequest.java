package com.midori.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateExamQuestionsRequest {

    @NotNull
    @Valid
    private List<ExamQuestionPayload> questions;
}

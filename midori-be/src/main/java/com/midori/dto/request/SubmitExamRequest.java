package com.midori.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SubmitExamRequest {

    @NotNull(message = "Answers are required")
    private List<Integer> answers;
}

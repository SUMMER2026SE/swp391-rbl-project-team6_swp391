package com.midori.dto.questiondto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class CreateTeacherQuestionRequest {
    private String topicId;
    @NotBlank
    private String prompt;
    private String jpPrompt;
    @NotBlank
    private String questionType;
    private String difficulty;
    @NotNull
    private Integer correctAnswerIndex;
    private String explanation;
    private String tags;
    private Integer points;
    @NotEmpty
    private List<String> options;
}

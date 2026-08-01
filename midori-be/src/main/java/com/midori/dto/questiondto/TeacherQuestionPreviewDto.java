package com.midori.dto.questiondto;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeacherQuestionPreviewDto {
    private UUID id;
    private String skill;
    private String difficulty;
    private Integer points;
    private String prompt;
    private List<String> options;
    private Integer correctAnswerIndex;
}

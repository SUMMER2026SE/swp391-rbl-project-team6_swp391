package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionResponse {

    private UUID id;
    private String prompt;
    private List<String> options;
    private Integer correctAnswerIndex;
    private Integer points;
    private Integer displayOrder;
}

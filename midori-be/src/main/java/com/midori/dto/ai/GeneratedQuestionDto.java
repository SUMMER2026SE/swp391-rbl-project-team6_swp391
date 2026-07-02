package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class GeneratedQuestionDto {

    private String questionText;
    private List<String> options;
    private Integer correctAnswerIndex;
    private String explanation;
    private String difficulty;
}

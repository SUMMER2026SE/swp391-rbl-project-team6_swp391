package com.midori.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswerRequest {
    private UUID questionId;
    private Integer selectedOptionIndex;
    private String textAnswer;
    private List<String> orderedTokens;
    private Map<String, String> matchingAnswers;
}

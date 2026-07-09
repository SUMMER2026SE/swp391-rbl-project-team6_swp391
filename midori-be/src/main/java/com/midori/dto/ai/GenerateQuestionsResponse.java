package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@AllArgsConstructor
public class GenerateQuestionsResponse {

    private String materialId;
    private String materialTitle;
    private List<GeneratedQuestionDto> questions;
    private String errorMessage;
    private Boolean isFallback;
    private String source;

    /**
     * Get questions mapped to frontend format (QuizQuestion).
     * Frontend expects: id, type, question, options, correctAnswer, explanation
     */
    public List<QuizQuestionResponse> getQuestionsForFrontend() {
        if (questions == null) return List.of();
        return questions.stream()
                .filter(q -> q.getQuestionText() != null && !q.getQuestionText().isBlank())
                .filter(q -> q.getCorrectAnswer() != null && !q.getCorrectAnswer().isBlank())
                .map(q -> {
                    String questionText = q.getQuestionText();
                    if (questionText == null || questionText.isBlank()) {
                        return null; // skip invalid
                    }

                    String correctAnswerText = q.getCorrectAnswer();
                    if (correctAnswerText == null || correctAnswerText.isBlank()) {
                        if (q.getOptions() != null && q.getCorrectAnswerIndex() != null
                                && q.getCorrectAnswerIndex() >= 0
                                && q.getCorrectAnswerIndex() < q.getOptions().size()) {
                            correctAnswerText = q.getOptions().get(q.getCorrectAnswerIndex());
                        } else {
                            return null; // skip invalid
                        }
                    }

                    String explanation = q.getExplanation();
                    if (explanation == null) explanation = "";

                    // Normalize type: default MULTIPLE_CHOICE if not set
                    String type = q.getType();
                    if (type == null || type.isBlank()) type = "MULTIPLE_CHOICE";
                    type = type.toUpperCase();

                    // For TRUE_FALSE, ensure options are exactly ["Đúng", "Sai"]
                    List<String> options = q.getOptions();
                    if ("TRUE_FALSE".equals(type) && options != null && options.size() == 2) {
                        options = List.of("Đúng", "Sai");
                    }

                    // For FILL_BLANK, options can be empty
                    if ("FILL_BLANK".equals(type)) {
                        options = List.of();
                    }

                    return QuizQuestionResponse.builder()
                            .id(q.getId() != null ? q.getId() : "q_" + questions.indexOf(q))
                            .type(type)
                            .question(questionText)
                            .options(options)
                            .correctAnswer(correctAnswerText)
                            .explanation(explanation)
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}

/**
 * Response DTO sent to frontend with question fields matching frontend QuizQuestion interface.
 * Frontend expects: id, type, question, options, correctAnswer, explanation
 */
@Data
@Builder
@AllArgsConstructor
class QuizQuestionResponse {
    private String id;
    private String type;
    private String question;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
}

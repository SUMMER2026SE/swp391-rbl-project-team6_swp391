package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response DTO sent to frontend with question fields matching frontend
 * QuizQuestion interface.
 *
 * <p>Frontend expects: {@code id, type, question, options, correctAnswer,
 * explanation}.
 *
 * <p>Marked {@code public} (and lives in its own file) so service-layer
 * tests can assert on the frontend-shape output without using reflection.
 */
@Data
@Builder
@AllArgsConstructor
public class QuizQuestionResponse {
    private String id;
    private String type;
    private String question;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
}

package com.midori.dto.reading;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Server-side grading response for a student Reading attempt.
 *
 * Includes everything the legacy {@code score} field exposed plus:
 *   - {@code correctAnswers} / {@code wrongAnswers} / {@code totalQuestions}
 *   - {@code percentage} (0–100, one decimal)
 *   - {@code answers[]} with the per-question breakdown used by the Review screen
 *
 * The legacy {@code score} integer is kept so existing callers do not break.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingSubmitResponse {

    private UUID readingLessonId;
    private UUID passageId;

    /** Legacy scalar. Same as {@code percentage} rounded down. */
    private Integer score;

    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;

    /** 0–100, one decimal place. */
    private Double percentage;

    private List<ReadingAnswerResult> answers;

    private Instant submittedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadingAnswerResult {
        private UUID questionId;
        private Integer questionOrder;
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;

        /** What the student picked (A/B/C/D), or null if skipped. */
        private String userAnswer;

        /** The letter of the correct option (A/B/C/D). */
        private String correctAnswer;

        /** Resolved text of the student's chosen option (or null). */
        private String userAnswerText;

        /** Resolved text of the correct option. */
        private String correctAnswerText;

        private Boolean isCorrect;

        private String explanation;
    }
}

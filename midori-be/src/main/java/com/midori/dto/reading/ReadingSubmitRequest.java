package com.midori.dto.reading;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class ReadingSubmitRequest {

    /**
     * Optional lesson-level submission. When null, the server grades every
     * question in the lesson.
     */
    private UUID passageId;

    @NotNull(message = "Answers are required")
    @NotEmpty(message = "Answers cannot be empty")
    private List<ReadingAnswerItem> answers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadingAnswerItem {
        @NotNull(message = "Question id is required")
        private UUID questionId;

        /**
         * Selected option letter (A/B/C/D). Case-insensitive.
         * May be null if the student skipped the question.
         */
        private String selectedAnswer;
    }
}

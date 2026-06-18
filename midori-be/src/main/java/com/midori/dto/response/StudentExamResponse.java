package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamResponse {

    private UUID id;
    private UUID examId;
    private String examTitle;
    private UUID studentId;
    private String examVersion;
    private String status;
    private Instant startedAt;
    private Instant submittedAt;
    private Integer score;
    private Integer totalPoints;
    private Double percentage;
    private List<QuestionResponse> questions;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private UUID id;
        private String questionText;
        private List<String> options;
        private Integer displayOrder;
        private Integer points;
        private Integer selectedAnswerIndex;
        private Integer correctAnswerIndex;
        private Boolean isCorrect;
    }
}

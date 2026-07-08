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
public class ExamResponse {

    private UUID id;
    private String title;
    private String level;
    private Integer totalQuestions;
    private Integer timeLimit;
    private String examMode;
    private String questionReuse;
    private Boolean randomizeAnswers;
    private String category;
    private Integer difficultyEasy;
    private Integer difficultyMedium;
    private Integer difficultyHard;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    private UUID assignedClassId;

    private List<ExamQuestionResponse> questions;

    // Student specific fields
    private Integer score;
    private Double percentage;
    private Instant submittedAt;
    private String feedback;
    private Instant gradedAt;
}

package com.midori.dto.listening;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningQuestionResponse {

    private UUID id;
    private UUID listeningLessonId;
    private Integer questionOrder;
    private String questionType;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private String explanation;
    private String audioUrl;
    private Instant createdAt;
    private Instant updatedAt;
}

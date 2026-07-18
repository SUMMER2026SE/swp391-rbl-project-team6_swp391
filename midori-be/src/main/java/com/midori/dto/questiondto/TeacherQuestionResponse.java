package com.midori.dto.questiondto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherQuestionResponse {
    private UUID id;
    private UUID teacherId;
    private String topicId;
    private String level;
    private String skill;
    private Integer lessonId;
    private String prompt;
    @Builder.Default
    private String source = "HOMEWORK";
    private String jpPrompt;
    private String questionType;
    private String difficulty;
    private Integer correctAnswerIndex;
    private String explanation;
    private String tags;
    private String status;
    private Integer points;
    private List<String> options;
    private String audioUrl;
    private String audioFileName;
    private Integer audioDuration;
    private Instant createdAt;
    private Instant updatedAt;
}

package com.midori.dto.homeworkdto;

import com.midori.entity.Homework.HomeworkStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkResponse {
    private UUID id;
    private UUID classId;
    private String lessonId;
    private String title;
    private String instructions;
    private Instant dueDate;
    private Integer maxScore;
    private Integer attempts;
    private HomeworkStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private java.util.List<com.midori.dto.questiondto.TeacherQuestionResponse> questions;
    private Integer totalQuestions;
    private Integer submissionCount;
    private Integer ungradedCount;
    private Integer remainingAttempts;
    private Integer timeLimit;
    private String teacherName;
    private String submissionStatus;
    private Integer score;
    private String feedback;
    private Instant gradedAt;
    private Instant submittedAt;
    /**
     * Average score across every graded submission of this homework, in the
     * same unit as `maxScore`. Null when there are no graded submissions
     * yet (no row should render as "—" or "N/A"). The number of graded
     * submissions is `submissionCount`; submissions without a grade are
     * filtered out so the average is not skewed by ungraded attempts.
     */
    private Double averageScore;
}

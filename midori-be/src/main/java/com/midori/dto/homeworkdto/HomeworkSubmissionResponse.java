package com.midori.dto.homeworkdto;

import com.midori.entity.HomeworkSubmission.SubmissionStatus;
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
public class HomeworkSubmissionResponse {
    private UUID id;
    private UUID homeworkId;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String submissionText;
    private String attachmentUrl;
    private Integer score;
    private String feedback;
    private SubmissionStatus status;
    private Instant submittedAt;
    private Instant gradedAt;
    private UUID gradedById;

    // ---- Aggregated fields used by Teacher "View Submission" page and Student View Result ----
    // Backend-authored single source of truth so the teacher and student see the same number.
    private Integer correctCount;
    private Integer totalQuestions;
    private Integer correctPercentage;
    private Integer focusViolationCount;
}

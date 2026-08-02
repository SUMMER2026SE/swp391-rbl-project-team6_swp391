package com.midori.dto.homeworkdto;

import lombok.Data;
import java.util.List;
import com.midori.dto.request.StudentAnswerRequest;

@Data
public class SubmitHomeworkRequest {
    private String submissionText;
    private String attachmentUrl;
    private java.util.Map<java.util.UUID, Integer> answers;
    private List<StudentAnswerRequest> textAnswers;
    /**
     * Number of anti-cheat / focus violations detected by the client during the attempt
     * (window blur, tab switch, fullscreen-exit, etc.). Stored on the submission so
     * the teacher can see it in the "View Submission" page. Defaults to 0 when not provided.
     */
    private Integer focusViolationCount;
}

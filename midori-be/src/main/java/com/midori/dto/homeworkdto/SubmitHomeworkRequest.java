package com.midori.dto.homeworkdto;

import lombok.Data;

@Data
public class SubmitHomeworkRequest {
    private String submissionText;
    private String attachmentUrl;
    private java.util.Map<java.util.UUID, Integer> answers;
}

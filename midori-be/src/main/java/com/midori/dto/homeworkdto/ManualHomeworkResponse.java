package com.midori.dto.homeworkdto;

import com.midori.entity.HomeworkStatus;
import com.midori.entity.HomeworkType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ManualHomeworkResponse {
    private UUID id;
    private String title;
    private String description;
    private String level;
    private HomeworkType type;
    private HomeworkStatus status;
    private Integer duration;
    private UUID teacherId;
    private String teacherName;
    private Integer questionCount;
    private Integer version;
    private List<ManualHomeworkQuestionResponse> questions;
    private Instant createdAt;
    private Instant updatedAt;
}

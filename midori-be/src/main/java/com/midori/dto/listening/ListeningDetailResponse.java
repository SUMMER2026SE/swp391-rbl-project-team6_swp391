package com.midori.dto.listening;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningDetailResponse {

    private UUID id;
    private String level;
    private UUID teacherId;
    private String teacherName;
    private String title;
    private String audioUrl;
    private String audioFileName;
    private String audioType;
    private String meaning;
    private String transcript;
    private String status;
    private UUID approvedBy;
    private Instant approvedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String topic;
}

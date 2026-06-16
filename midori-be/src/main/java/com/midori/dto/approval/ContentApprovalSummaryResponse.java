package com.midori.dto.approval;

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
public class ContentApprovalSummaryResponse {

    private String contentType;
    private UUID contentId;
    private String title;
    private String level;
    private String status;
    private UUID teacherId;
    private String teacherName;
    private String rejectReason;
    private Instant submittedAt;
    private Instant updatedAt;

    // Indicates if this is a pending update to an already approved grammar
    private Boolean hasPendingUpdate;
}

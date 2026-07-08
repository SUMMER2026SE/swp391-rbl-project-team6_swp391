package com.midori.dto.response;

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
public class AiImportJobResponse {

    private UUID jobId;
    private String status;
    private String message;
    private UUID examId;
    private Integer questionCount;
    private Instant createdAt;
    private Instant completedAt;
}

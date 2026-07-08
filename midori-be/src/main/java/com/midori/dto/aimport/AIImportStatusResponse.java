package com.midori.dto.aimport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for checking import job status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIImportStatusResponse {

    private String jobId;

    private String status;

    private String examId;

    private Integer questionCount;

    private String examTitle;

    private String errorMessage;

    private long processingTimeMs;

    private String providerUsed;
}

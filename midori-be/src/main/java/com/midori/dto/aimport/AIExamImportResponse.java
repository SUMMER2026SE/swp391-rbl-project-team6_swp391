package com.midori.dto.aimport;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for AI PDF Exam Import operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIExamImportResponse {

    @NotNull
    private String examId;

    private String status;

    private int questionCount;

    private String examTitle;

    private String providerUsed;

    private long processingTimeMs;

    private String message;
}

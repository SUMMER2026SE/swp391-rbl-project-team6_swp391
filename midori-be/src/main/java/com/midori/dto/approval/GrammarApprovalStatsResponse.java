package com.midori.dto.approval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarApprovalStatsResponse {
    private long pendingReview;
    private long totalGrammar;
    private long approved;
    private long rejected;
    private long draft;
}

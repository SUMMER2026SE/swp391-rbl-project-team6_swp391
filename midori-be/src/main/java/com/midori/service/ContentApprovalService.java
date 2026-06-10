package com.midori.service;

import com.midori.dto.approval.ContentApprovalDetailResponse;
import com.midori.dto.approval.ContentApprovalSummaryResponse;
import com.midori.dto.approval.ContentRejectRequest;
import com.midori.dto.approval.GrammarApprovalStatsResponse;

import java.util.List;
import java.util.UUID;

public interface ContentApprovalService {

    List<ContentApprovalSummaryResponse> listPendingContent(String contentType);

    ContentApprovalDetailResponse getPendingContentDetail(String contentType, UUID contentId);

    ContentApprovalSummaryResponse approveContent(String contentType, UUID contentId);

    ContentApprovalSummaryResponse rejectContent(String contentType, UUID contentId, ContentRejectRequest request);

    GrammarApprovalStatsResponse getGrammarApprovalStats();
}

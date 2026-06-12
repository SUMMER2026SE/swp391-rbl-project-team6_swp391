package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.approval.ContentApprovalDetailResponse;
import com.midori.dto.approval.ContentApprovalSummaryResponse;
import com.midori.dto.approval.ContentRejectRequest;
import com.midori.dto.approval.GrammarApprovalStatsResponse;
import com.midori.service.ContentApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/content-approvals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ContentApprovalController {

    private final ContentApprovalService contentApprovalService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ContentApprovalSummaryResponse>>> listPendingContent(
            @RequestParam(required = false) String contentType) {
        List<ContentApprovalSummaryResponse> pending = contentApprovalService.listPendingContent(contentType);
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @GetMapping("/approved")
    public ResponseEntity<ApiResponse<List<ContentApprovalSummaryResponse>>> listApprovedContent(
            @RequestParam(required = false) String contentType) {
        List<ContentApprovalSummaryResponse> approved = contentApprovalService.listApprovedContent(contentType);
        return ResponseEntity.ok(ApiResponse.success(approved));
    }

    @GetMapping("/grammar-statistics")
    public ResponseEntity<ApiResponse<GrammarApprovalStatsResponse>> getGrammarApprovalStats() {
        GrammarApprovalStatsResponse stats = contentApprovalService.getGrammarApprovalStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{contentType}/{contentId}")
    public ResponseEntity<ApiResponse<ContentApprovalDetailResponse>> getContentDetail(
            @PathVariable String contentType,
            @PathVariable UUID contentId) {
        ContentApprovalDetailResponse detail = contentApprovalService.getPendingContentDetail(contentType, contentId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/{contentType}/{contentId}/approve")
    public ResponseEntity<ApiResponse<ContentApprovalSummaryResponse>> approveContent(
            @PathVariable String contentType,
            @PathVariable UUID contentId) {
        ContentApprovalSummaryResponse approved = contentApprovalService.approveContent(contentType, contentId);
        return ResponseEntity.ok(ApiResponse.success("Content approved successfully", approved));
    }

    @PostMapping("/{contentType}/{contentId}/reject")
    public ResponseEntity<ApiResponse<ContentApprovalSummaryResponse>> rejectContent(
            @PathVariable String contentType,
            @PathVariable UUID contentId,
            @Valid @RequestBody ContentRejectRequest request) {
        ContentApprovalSummaryResponse rejected = contentApprovalService.rejectContent(contentType, contentId, request);
        return ResponseEntity.ok(ApiResponse.success("Content rejected", rejected));
    }
}

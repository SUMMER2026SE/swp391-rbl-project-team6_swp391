package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AIReportSummaryResponse;
import com.midori.service.AIReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ai/reports")
@RequiredArgsConstructor
public class AIReportController {

    private final AIReportService aiReportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AIReportSummaryResponse>> getSummary() {
        AIReportSummaryResponse summary = aiReportService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/summary/range")
    public ResponseEntity<ApiResponse<AIReportSummaryResponse>> getSummaryByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        AIReportSummaryResponse summary = aiReportService.getSummaryByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}

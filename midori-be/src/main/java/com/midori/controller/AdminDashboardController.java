package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.JlptDistributionResponse;
import com.midori.dto.response.RecentActivitiesResponse;
import com.midori.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminDashboardSummaryResponse>> getSummary() {
        AdminDashboardSummaryResponse summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/jlpt-distribution")
    public ResponseEntity<ApiResponse<JlptDistributionResponse>> getJlptDistribution() {
        JlptDistributionResponse data = dashboardService.getJlptDistribution();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<ApiResponse<RecentActivitiesResponse>> getRecentActivities(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        RecentActivitiesResponse data = dashboardService.getRecentActivities(limit);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}

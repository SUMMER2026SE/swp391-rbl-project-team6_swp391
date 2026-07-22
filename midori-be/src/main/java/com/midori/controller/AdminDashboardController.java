package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.AdminRecentActivitiesResponse;
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

    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<AdminRecentActivitiesResponse>> getRecentActivities(
            @RequestParam(defaultValue = "6") int limit) {
        AdminRecentActivitiesResponse activities = dashboardService.getRecentActivities(limit);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }
}

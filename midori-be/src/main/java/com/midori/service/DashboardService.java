package com.midori.service;

import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.AdminRecentActivitiesResponse;

public interface DashboardService {

    AdminDashboardSummaryResponse getSummary();

    AdminRecentActivitiesResponse getRecentActivities();

    AdminRecentActivitiesResponse getRecentActivities(int limit);
}

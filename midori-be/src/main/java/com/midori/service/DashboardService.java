package com.midori.service;

import com.midori.dto.response.AdminDashboardSummaryResponse;
import com.midori.dto.response.JlptDistributionResponse;
import com.midori.dto.response.RecentActivitiesResponse;

public interface DashboardService {

    AdminDashboardSummaryResponse getSummary();

    JlptDistributionResponse getJlptDistribution();

    RecentActivitiesResponse getRecentActivities(int limit);
}

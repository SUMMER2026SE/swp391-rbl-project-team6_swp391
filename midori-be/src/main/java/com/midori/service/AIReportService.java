package com.midori.service;

import com.midori.dto.ai.AIReportSummaryResponse;

public interface AIReportService {

    AIReportSummaryResponse getSummary();

    AIReportSummaryResponse getSummaryByDateRange(String startDate, String endDate);
}

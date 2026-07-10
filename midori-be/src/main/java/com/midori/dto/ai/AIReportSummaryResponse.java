package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIReportSummaryResponse {

    private long totalAiRequests;
    private long totalUsers;
    private Double averageResponseTime;
    private Long totalTokens;
    private List<FeatureUsage> usageByFeature;
    private List<DailyUsage> usageByDay;
    private double successRate;
    private double failureRate;
    private List<ModelUsage> topUsedModels;
    private List<FeatureCount> topUsedFeatures;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureUsage {
        private String feature;
        private long count;
        private Long totalTokens;
        private Double averageProcessingTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyUsage {
        private String date;
        private long count;
        private Long totalTokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelUsage {
        private String provider;
        private String model;
        private long count;
        private Long totalTokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureCount {
        private String feature;
        private long count;
    }
}

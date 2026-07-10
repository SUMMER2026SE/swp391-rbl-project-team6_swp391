package com.midori.service.impl;

import com.midori.dto.ai.AIReportSummaryResponse;
import com.midori.dto.ai.AIReportSummaryResponse.DailyUsage;
import com.midori.dto.ai.AIReportSummaryResponse.FeatureCount;
import com.midori.dto.ai.AIReportSummaryResponse.FeatureUsage;
import com.midori.dto.ai.AIReportSummaryResponse.ModelUsage;
import com.midori.repository.AIUsageLogRepository;
import com.midori.service.AIReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIReportServiceImpl implements AIReportService {

    private final AIUsageLogRepository aiUsageLogRepository;

    @Override
    public AIReportSummaryResponse getSummary() {
        long totalAiRequests = aiUsageLogRepository.count();
        Long totalUsers = aiUsageLogRepository.countDistinctUsers();
        Double avgProcessingTime = aiUsageLogRepository.avgProcessingTime();
        Long totalTokens = aiUsageLogRepository.sumTotalTokens();

        List<Object[]> usageByFeatureRaw = aiUsageLogRepository.getUsageByFeature();
        List<FeatureUsage> usageByFeature = convertToFeatureUsage(usageByFeatureRaw);

        List<Object[]> usageByDayRaw = aiUsageLogRepository.getUsageByDay();
        List<DailyUsage> usageByDay = convertToDailyUsage(usageByDayRaw);

        List<Object[]> statusCounts = aiUsageLogRepository.getUsageByStatus();
        long successCount = 0;
        long failureCount = 0;
        for (Object[] row : statusCounts) {
            String status = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            if ("SUCCESS".equals(status)) {
                successCount = count;
            } else if ("FAILED".equals(status)) {
                failureCount = count;
            }
        }

        double successRate = totalAiRequests > 0 
            ? BigDecimal.valueOf((double) successCount / totalAiRequests * 100)
                .setScale(2, RoundingMode.HALF_UP).doubleValue() 
            : 0.0;
        double failureRate = totalAiRequests > 0 
            ? BigDecimal.valueOf((double) failureCount / totalAiRequests * 100)
                .setScale(2, RoundingMode.HALF_UP).doubleValue() 
            : 0.0;

        List<Object[]> topModelsRaw = aiUsageLogRepository.getTopModels();
        List<ModelUsage> topUsedModels = convertToModelUsage(topModelsRaw);

        List<Object[]> topFeaturesRaw = aiUsageLogRepository.getTopFeatures();
        List<FeatureCount> topUsedFeatures = convertToFeatureCount(topFeaturesRaw);

        return AIReportSummaryResponse.builder()
                .totalAiRequests(totalAiRequests)
                .totalUsers(totalUsers != null ? totalUsers : 0)
                .averageResponseTime(avgProcessingTime != null 
                    ? BigDecimal.valueOf(avgProcessingTime).setScale(2, RoundingMode.HALF_UP).doubleValue() 
                    : 0.0)
                .totalTokens(totalTokens != null ? totalTokens : 0)
                .usageByFeature(usageByFeature)
                .usageByDay(usageByDay)
                .successRate(successRate)
                .failureRate(failureRate)
                .topUsedModels(topUsedModels)
                .topUsedFeatures(topUsedFeatures)
                .build();
    }

    @Override
    public AIReportSummaryResponse getSummaryByDateRange(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_DATE);
        
        var startInstant = start.atStartOfDay().toInstant(java.time.ZoneOffset.UTC);
        var endInstant = end.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC);

        var logsInRange = aiUsageLogRepository.findByDateRange(startInstant, endInstant);
        
        long totalAiRequests = logsInRange.size();
        long distinctUsers = logsInRange.stream().map(l -> l.getUserId()).distinct().count();
        
        double avgProcessingTime = logsInRange.stream()
                .mapToLong(l -> l.getProcessingTime())
                .average()
                .orElse(0.0);
        
        long totalTokens = logsInRange.stream()
                .mapToLong(l -> l.getTotalTokens())
                .sum();

        long successCount = logsInRange.stream()
                .filter(l -> l.getStatus().name().equals("SUCCESS"))
                .count();
        long failureCount = logsInRange.stream()
                .filter(l -> l.getStatus().name().equals("FAILED"))
                .count();

        double successRate = totalAiRequests > 0 
            ? BigDecimal.valueOf((double) successCount / totalAiRequests * 100)
                .setScale(2, RoundingMode.HALF_UP).doubleValue() 
            : 0.0;
        double failureRate = totalAiRequests > 0 
            ? BigDecimal.valueOf((double) failureCount / totalAiRequests * 100)
                .setScale(2, RoundingMode.HALF_UP).doubleValue() 
            : 0.0;

        List<FeatureUsage> usageByFeature = logsInRange.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        com.midori.entity.AIUsageLog::getFeature,
                        java.util.stream.Collectors.toList()))
                .entrySet().stream()
                .map(entry -> FeatureUsage.builder()
                        .feature(entry.getKey())
                        .count(entry.getValue().size())
                        .totalTokens(entry.getValue().stream().mapToLong(com.midori.entity.AIUsageLog::getTotalTokens).sum())
                        .averageProcessingTime(entry.getValue().stream()
                                .mapToLong(com.midori.entity.AIUsageLog::getProcessingTime)
                                .average()
                                .orElse(0.0))
                        .build())
                .toList();

        List<DailyUsage> usageByDay = logsInRange.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        l -> l.getCreatedAt().toString().substring(0, 10),
                        java.util.stream.Collectors.toList()))
                .entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(entry -> DailyUsage.builder()
                        .date(entry.getKey())
                        .count(entry.getValue().size())
                        .totalTokens(entry.getValue().stream().mapToLong(com.midori.entity.AIUsageLog::getTotalTokens).sum())
                        .build())
                .toList();

        List<ModelUsage> topUsedModels = logsInRange.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        l -> new java.util.AbstractMap.SimpleEntry<>(l.getProvider(), l.getModel()),
                        java.util.stream.Collectors.toList()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue().size(), a.getValue().size()))
                .limit(10)
                .map(entry -> ModelUsage.builder()
                        .provider(entry.getKey().getKey())
                        .model(entry.getKey().getValue())
                        .count(entry.getValue().size())
                        .totalTokens(entry.getValue().stream().mapToLong(com.midori.entity.AIUsageLog::getTotalTokens).sum())
                        .build())
                .toList();

        List<FeatureCount> topUsedFeatures = logsInRange.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        com.midori.entity.AIUsageLog::getFeature,
                        java.util.stream.Collectors.toList()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue().size(), a.getValue().size()))
                .limit(10)
                .map(entry -> FeatureCount.builder()
                        .feature(entry.getKey())
                        .count(entry.getValue().size())
                        .build())
                .toList();

        return AIReportSummaryResponse.builder()
                .totalAiRequests(totalAiRequests)
                .totalUsers(distinctUsers)
                .averageResponseTime(BigDecimal.valueOf(avgProcessingTime).setScale(2, RoundingMode.HALF_UP).doubleValue())
                .totalTokens(totalTokens)
                .usageByFeature(usageByFeature)
                .usageByDay(usageByDay)
                .successRate(successRate)
                .failureRate(failureRate)
                .topUsedModels(topUsedModels)
                .topUsedFeatures(topUsedFeatures)
                .build();
    }

    private List<FeatureUsage> convertToFeatureUsage(List<Object[]> raw) {
        List<FeatureUsage> result = new ArrayList<>();
        if (raw == null) return result;
        
        for (Object[] row : raw) {
            String feature = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            Long totalTokens = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            Double avgTime = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
            
            result.add(FeatureUsage.builder()
                    .feature(feature)
                    .count(count)
                    .totalTokens(totalTokens)
                    .averageProcessingTime(BigDecimal.valueOf(avgTime).setScale(2, RoundingMode.HALF_UP).doubleValue())
                    .build());
        }
        return result;
    }

    private List<DailyUsage> convertToDailyUsage(List<Object[]> raw) {
        List<DailyUsage> result = new ArrayList<>();
        if (raw == null) return result;
        
        for (Object[] row : raw) {
            String date = row[0] != null ? row[0].toString() : "";
            Long count = ((Number) row[1]).longValue();
            Long totalTokens = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            
            result.add(DailyUsage.builder()
                    .date(date)
                    .count(count)
                    .totalTokens(totalTokens)
                    .build());
        }
        return result;
    }

    private List<ModelUsage> convertToModelUsage(List<Object[]> raw) {
        List<ModelUsage> result = new ArrayList<>();
        if (raw == null) return result;
        
        for (Object[] row : raw) {
            String provider = (String) row[0];
            String model = (String) row[1];
            Long count = ((Number) row[2]).longValue();
            Long totalTokens = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            
            result.add(ModelUsage.builder()
                    .provider(provider)
                    .model(model)
                    .count(count)
                    .totalTokens(totalTokens)
                    .build());
        }
        return result;
    }

    private List<FeatureCount> convertToFeatureCount(List<Object[]> raw) {
        List<FeatureCount> result = new ArrayList<>();
        if (raw == null) return result;
        
        for (Object[] row : raw) {
            String feature = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            
            result.add(FeatureCount.builder()
                    .feature(feature)
                    .count(count)
                    .build());
        }
        return result;
    }
}

package com.midori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JlptDistributionResponse {

    private long totalClasses;
    private List<JlptLevelCount> levels;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JlptLevelCount {
        private String level;
        private long count;
        private double percentage;
    }
}
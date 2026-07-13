package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingTranscriptUpdateRequest {
    private Double startTime;
    private Double endTime;
    private String jpText;
    private String vnText;
}

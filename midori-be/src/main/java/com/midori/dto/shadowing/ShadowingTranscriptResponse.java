package com.midori.dto.shadowing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShadowingTranscriptResponse {

    private UUID id;
    private UUID videoId;
    private Integer sentenceOrder;
    private Integer startTime;
    private Integer endTime;
    private String jpText;
    private String vnText;
}

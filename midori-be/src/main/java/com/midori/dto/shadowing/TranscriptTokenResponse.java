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
public class TranscriptTokenResponse {
    private UUID id;
    private String surface;
    private String lemma;
    private String reading;
    private Integer position;
}

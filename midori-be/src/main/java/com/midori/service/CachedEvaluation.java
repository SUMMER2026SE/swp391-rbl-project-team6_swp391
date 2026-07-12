package com.midori.service;

import com.midori.dto.shadowing.ShadowingEvaluationResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class CachedEvaluation {
    private ShadowingEvaluationResponse response;
    private Instant expiresAt;

    public boolean expired() {
        return Instant.now().isAfter(expiresAt);
    }
}

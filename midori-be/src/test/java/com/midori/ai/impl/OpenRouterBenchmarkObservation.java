package com.midori.ai.impl;

/** Test bridge for package-private OpenRouter chat observations. */
public final class OpenRouterBenchmarkObservation {

    private OpenRouterBenchmarkObservation() {
    }

    public static void enable(OpenRouterProvider provider) {
        provider.setBenchmarkObservationEnabled(true);
    }

    public static void disable(OpenRouterProvider provider) {
        provider.setBenchmarkObservationEnabled(false);
    }

    public static Snapshot snapshot(OpenRouterProvider provider) {
        OpenRouterProvider.ChatObservation observation = provider.getLastChatObservation();
        if (observation == null) return null;
        return new Snapshot(
                observation.provider(),
                observation.requestedModel(),
                observation.actualResolvedModel(),
                observation.fallbackModelUsed(),
                observation.fallbackOccurred(),
                observation.finishReason(),
                observation.latencyMs(),
                observation.errorOrRetryCount(),
                observation.promptTokens(),
                observation.completionTokens(),
                observation.totalTokens(),
                observation.rawHttpResponse(),
                observation.rawHttpResponseBase64(),
                observation.error());
    }

    public record Snapshot(
            String provider,
            String requestedModel,
            String actualResolvedModel,
            String fallbackModelUsed,
            boolean fallbackOccurred,
            String finishReason,
            long latencyMs,
            int errorOrRetryCount,
            Long promptTokens,
            Long completionTokens,
            Long totalTokens,
            String rawHttpResponse,
            String rawHttpResponseBase64,
            String error) {
    }
}

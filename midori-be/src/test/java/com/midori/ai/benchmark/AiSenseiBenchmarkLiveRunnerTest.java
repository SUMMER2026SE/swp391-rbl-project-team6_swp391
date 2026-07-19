package com.midori.ai.benchmark;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Offline smoke verification for the AI Sensei benchmark.
 *
 * <p>This test is the always-on, never-network companion to
 * {@link AiSenseiBenchmarkLiveIntegrationTest}. It exercises the dataset
 * loader, the evaluator, and the report writer with a deterministic
 * canned responder so contributors can run {@code mvn test} offline.
 *
 * <p>It does NOT contact any AI provider. The live benchmark is in
 * {@link AiSenseiBenchmarkLiveIntegrationTest} and is gated by both
 * {@code AI_BENCHMARK_ENABLED} and {@code AI_BENCHMARK_USE_REAL_PROVIDER}.
 */
class AiSenseiBenchmarkLiveRunnerTest {

    private static final String SMOKE_RESOURCE = "ai-benchmark/ai-sensei-smoke-benchmark.json";

    @Test
    @DisplayName("Offline: smoke set evaluated with canned responder never hits AI")
    void smokeAlwaysAvailableOffline() {
        AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                SMOKE_RESOURCE, 20, 0);
        AiSenseiBenchmarkEvaluator evaluator = new AiSenseiBenchmarkEvaluator();
        List<AiSenseiBenchmarkEvaluator.CaseResult> results = new ArrayList<>();
        for (AiSenseiBenchmarkCase c : ds.cases()) {
            String canned = cannedResponseFor(c);
            results.add(evaluator.evaluate(c, canned));
        }
        int totalScore = results.stream().mapToInt(r -> r.score).sum();
        assertTrue(totalScore > 0,
                "Canned offline responses should score > 0, got " + totalScore);
        int maxScore = results.stream().mapToInt(r -> r.benchmarkCase.getMaxScore()).sum();
        assertTrue(totalScore <= maxScore,
                "Score " + totalScore + " should be <= max " + maxScore);
    }

    /**
     * Offline canned responder that produces a brief, terminology-rich
     * Japanese-style answer for each case. It is intentionally generic and
     * does NOT call any AI.
     */
    private String cannedResponseFor(AiSenseiBenchmarkCase c) {
        StringBuilder sb = new StringBuilder();
        sb.append("【").append(c.getCategory()).append(" / ").append(c.getLevel()).append("】\n\n");
        sb.append("これは練習用のサンプル回答です。実際の評価では AI Sensei の応答が入ります。\n\n");
        sb.append("例えば以下のように説明できます:\n");
        for (int i = 0; i < Math.min(3, c.getExpectedFacts().size()); i++) {
            sb.append("・").append(c.getExpectedFacts().get(i)).append('\n');
        }
        sb.append("\nもう一つの例:\n");
        if (c.getExpectedFacts().size() > 3) {
            sb.append("・").append(c.getExpectedFacts().get(3)).append('\n');
        }
        return sb.toString();
    }
}
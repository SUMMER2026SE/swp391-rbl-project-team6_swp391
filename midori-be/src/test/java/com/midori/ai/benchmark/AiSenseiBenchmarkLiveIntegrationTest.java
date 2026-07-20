package com.midori.ai.benchmark;

import com.midori.ai.core.AiCoreService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Live benchmark runner that sends real benchmark prompts through the
 * existing AI Sensei chat path.
 *
 * <p>This test is gated by TWO environment variables. It is skipped unless
 * both are set:
 *
 * <ul>
 *   <li>{@code AI_BENCHMARK_ENABLED=true} — opt-in flag for benchmark runs.</li>
 *   <li>{@code AI_BENCHMARK_USE_REAL_PROVIDER=true} — confirms the caller
 *       accepts real network calls to the configured AI provider.</li>
 * </ul>
 *
 * <p>Under normal {@code mvn test} (without either variable), this test is
 * skipped via JUnit assumptions and NEVER contacts any external AI provider.
 *
 * <p>The runner reuses the production chat path via
 * {@link AiSenseiBenchmarkResponder}, which calls
 * {@link AiCoreService#chat(String, String, java.util.List)} with
 * {@link com.midori.ai.prompt.AiPromptBuilder#getChatSystemPrompt()} — the
 * exact system prompt used by {@code AiServiceImpl.chat(...)} when no
 * material is selected. The benchmark therefore evaluates the no-material
 * full Japanese assistant behavior with the real configured provider.
 *
 * <p>Two methods are exposed:
 *
 * <ul>
 *   <li>{@link #runSmokeBenchmark()} — runs exactly the 20 smoke cases and
 *       writes {@code target/ai-benchmark/ai-sensei-smoke-report.json} and
 *       {@code .md}.</li>
 *   <li>{@link #runFullBenchmark()} — runs exactly the 100 full cases and
 *       writes {@code target/ai-benchmark/ai-sensei-full-report.json} and
 *       {@code .md}.</li>
 * </ul>
 *
 * <p>Each method is selected independently via Surefire's {@code #method}
 * syntax so smoke and full never run from the same command accidentally.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@EnabledIfEnvironmentVariable(named = "AI_BENCHMARK_ENABLED", matches = "true")
class AiSenseiBenchmarkLiveIntegrationTest {

    /** Primary opt-in flag. */
    public static final String ENABLED_ENV = "AI_BENCHMARK_ENABLED";
    /** Secondary flag that explicitly accepts real provider calls. */
    public static final String REAL_PROVIDER_ENV = "AI_BENCHMARK_USE_REAL_PROVIDER";
    /** Optional model override scoped to this Spring test context. */
    public static final String MODEL_ENV = "AI_BENCHMARK_MODEL";

    private static final String FULL_RESOURCE = "ai-benchmark/ai-sensei-benchmark.json";
    private static final String SMOKE_RESOURCE = "ai-benchmark/ai-sensei-smoke-benchmark.json";

    @DynamicPropertySource
    static void benchmarkModelOverride(DynamicPropertyRegistry registry) {
        String model = System.getenv(MODEL_ENV);
        if (model == null || model.isBlank()) return;
        registry.add("ai.provider", () -> "openrouter");
        registry.add("ai.openrouter.models", () -> model.trim());
        registry.add("ai.openrouter.fallback-models", () -> "");
    }

    @Autowired
    private AiCoreService aiCoreService;

    /**
     * Runs the 20-case smoke benchmark against the real provider and writes
     * the canonical smoke report files.
     *
     * <p>Command:
     * <pre>{@code
     * $env:AI_BENCHMARK_ENABLED='true'
     * $env:AI_BENCHMARK_USE_REAL_PROVIDER='true'
     * mvn test -Dtest=AiSenseiBenchmarkLiveIntegrationTest#runSmokeBenchmark
     * }</pre>
     */
    @Test
    @DisplayName("Live: run 20-case smoke benchmark against the real provider")
    void runSmokeBenchmark() throws Exception {
        assumeLiveEnabled();
        AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                SMOKE_RESOURCE, 20, 0);
        runAndReport(ds, "smoke");
    }

    /**
     * Runs the 100-case full benchmark against the real provider and writes
     * the canonical full report files.
     *
     * <p>Command:
     * <pre>{@code
     * $env:AI_BENCHMARK_ENABLED='true'
     * $env:AI_BENCHMARK_USE_REAL_PROVIDER='true'
     * mvn test -Dtest=AiSenseiBenchmarkLiveIntegrationTest#runFullBenchmark
     * }</pre>
     */
    @Test
    @DisplayName("Live: run 100-case full benchmark against the real provider")
    void runFullBenchmark() throws Exception {
        assumeLiveEnabled();
        AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                FULL_RESOURCE, 100, 10,
                AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
        runAndReport(ds, "full");
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    private void runAndReport(AiSenseiBenchmarkDataset ds, String label) throws Exception {
        AiSenseiBenchmarkResponder responder = new AiSenseiBenchmarkResponder(aiCoreService);
        AiSenseiBenchmarkEvaluator evaluator = new AiSenseiBenchmarkEvaluator();
        List<AiSenseiBenchmarkEvaluator.CaseResult> results = new ArrayList<>();
        List<AiSenseiBenchmarkDiagnostic> diagnostics = new ArrayList<>();
        for (AiSenseiBenchmarkCase c : ds.cases()) {
            AiSenseiBenchmarkDiagnostic diagnostic = responder.respondWithDiagnostics(c.getId(), c.getPrompt());
            diagnostics.add(diagnostic);
            results.add(evaluator.evaluate(c, diagnostic.sanitizedResponse()));
        }
        AiSenseiBenchmarkReport reportWriter = new AiSenseiBenchmarkReport();
        reportWriter.writeToTargetCanonical(ds, results, label, diagnostics);

        int totalScore = results.stream().mapToInt(r -> r.score).sum();
        int maxScore = results.stream().mapToInt(r -> r.benchmarkCase.getMaxScore()).sum();
        // Sanity: at least one case must have been evaluated.
        assertFalse(results.isEmpty(),
                "Benchmark produced no results for label=" + label);
        // Reports must exist.
        java.nio.file.Path outDir = java.nio.file.Paths.get("target", "ai-benchmark");
        String base = label.equals("smoke") ? "ai-sensei-smoke-report" : "ai-sensei-full-report";
        assertTrue(java.nio.file.Files.exists(outDir.resolve(base + ".json")),
                "JSON report missing: " + outDir.resolve(base + ".json"));
        assertTrue(java.nio.file.Files.exists(outDir.resolve(base + ".md")),
                "Markdown report missing: " + outDir.resolve(base + ".md"));
        System.out.println(String.format(
                "[AI Sensei Benchmark] %s: %d/%d cases, score %d/%d",
                label, results.size(), ds.size(), totalScore, maxScore));
    }

    private static void assumeLiveEnabled() {
        String enabled = System.getenv(ENABLED_ENV);
        String realProvider = System.getenv(REAL_PROVIDER_ENV);
        boolean on = isTrue(enabled) && isTrue(realProvider);
        org.junit.jupiter.api.Assumptions.assumeTrue(on,
                "Live benchmark disabled. Set both " + ENABLED_ENV
                        + "=true and " + REAL_PROVIDER_ENV + "=true to enable.");
    }

    private static boolean isTrue(String value) {
        return value != null
                && (value.equalsIgnoreCase("true") || value.equals("1"));
    }
}
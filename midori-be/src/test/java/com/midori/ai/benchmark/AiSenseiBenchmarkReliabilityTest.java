package com.midori.ai.benchmark;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSenseiBenchmarkReliabilityTest {

    @TempDir
    Path tempDir;

    @Test
    void thirtyOnePercentWithZeroPassIsUnhealthyAndRecommendsModelChange() {
        AiSenseiBenchmarkDataset dataset = AiSenseiBenchmarkDataset.loadAndValidate(
                "ai-benchmark/ai-sensei-smoke-benchmark.json", 20, 0);
        List<AiSenseiBenchmarkEvaluator.CaseResult> results = new ArrayList<>();
        for (int i = 0; i < dataset.size(); i++) {
            int score = i < 7 ? 4 : i < 15 ? 3 : 2;
            results.add(result(dataset.cases().get(i), score, "日本語の短い回答です。"));
        }

        Map<String, Object> report = new AiSenseiBenchmarkReport()
                .buildReport(dataset, results, "offline-reliability");

        assertEquals(62, report.get("totalScore"));
        assertEquals(31.0, report.get("percentage"));
        assertEquals(false, report.get("overallHealthy"));
        assertEquals(false, report.get("promptChangeRecommended"));
        assertEquals(true, report.get("modelChangeRecommended"));
        assertEquals(false, report.get("encodingInvestigationRecommended"));
    }

    @Test
    void recommendsEncodingInvestigationOnlyWhenCorruptionAppearsAfterRawProviderText() {
        AiSenseiBenchmarkDataset dataset = AiSenseiBenchmarkDataset.loadAndValidate(
                "ai-benchmark/ai-sensei-smoke-benchmark.json", 20, 0);
        AiSenseiBenchmarkCase benchmarkCase = dataset.cases().get(0);
        String raw = "日本語は正常です。";
        String sanitized = "日本語は�です。";
        AiSenseiBenchmarkDiagnostic diagnostic = diagnostic(
                benchmarkCase.getId(), raw, sanitized, "openrouter/free", "google/gemma-3-27b-it:free");

        Map<String, Object> report = new AiSenseiBenchmarkReport().buildReport(
                dataset,
                List.of(result(benchmarkCase, 4, sanitized)),
                "encoding-test",
                List.of(diagnostic));

        assertEquals(true, report.get("encodingInvestigationRecommended"));
        @SuppressWarnings("unchecked")
        Map<String, Object> integrity = (Map<String, Object>) report.get("characterIntegrity");
        assertEquals(0, integrity.get("rawProviderMalformedCharacterCount"));
        assertEquals(1, integrity.get("sanitizedMalformedCharacterCount"));
        assertEquals(true, integrity.get("malformedIntroducedBetweenRawAndFinal"));
    }

    @Test
    void rawProviderCorruptionIsClassifiedAsModelIssueNotDownstreamEncodingMutation() {
        AiSenseiBenchmarkDataset dataset = AiSenseiBenchmarkDataset.loadAndValidate(
                "ai-benchmark/ai-sensei-smoke-benchmark.json", 20, 0);
        AiSenseiBenchmarkCase benchmarkCase = dataset.cases().get(0);
        String malformed = "ã�“ã‚Œは壊れた応答です。";
        AiSenseiBenchmarkDiagnostic diagnostic = diagnostic(
                benchmarkCase.getId(), malformed, malformed, "openrouter/free", "routed/free-model");

        Map<String, Object> report = new AiSenseiBenchmarkReport().buildReport(
                dataset,
                List.of(result(benchmarkCase, 2, malformed)),
                "raw-corruption-test",
                List.of(diagnostic));

        assertEquals(false, report.get("encodingInvestigationRecommended"));
        assertEquals(true, report.get("modelChangeRecommended"));
        assertTrue(report.get("rootCauseSummary").toString().contains("raw provider response"));
    }

    @Test
    void jsonReportRoundTripPreservesFinalJapaneseResponseAndModelMetadata() throws Exception {
        AiSenseiBenchmarkDataset dataset = AiSenseiBenchmarkDataset.loadAndValidate(
                "ai-benchmark/ai-sensei-smoke-benchmark.json", 20, 0);
        AiSenseiBenchmarkCase benchmarkCase = dataset.cases().get(0);
        String response = "「です」は助動詞として扱われます。例えば、学生です。";
        AiSenseiBenchmarkDiagnostic diagnostic = diagnostic(
                benchmarkCase.getId(), response, response,
                "openrouter/free", "google/gemma-3-27b-it:free");

        new AiSenseiBenchmarkReport().writeToCanonical(
                dataset,
                List.of(result(benchmarkCase, 7, response)),
                "round-trip",
                List.of(diagnostic),
                tempDir);

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> report = mapper.readValue(
                Files.readAllBytes(tempDir.resolve("ai-sensei-smoke-report.json")),
                new TypeReference<Map<String, Object>>() { });
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cases = (List<Map<String, Object>>) report.get("caseDetails");
        assertEquals(response, cases.get(0).get("finalReportResponse"));
        @SuppressWarnings("unchecked")
        Map<String, Object> identity = (Map<String, Object>) report.get("modelIdentity");
        assertEquals("openrouter/free", identity.get("requestedModel"));
        assertTrue(identity.get("actualResolvedModels").toString().contains("google/gemma-3-27b-it:free"));
    }

    @Test
    void sanitizerDoesNotHideOrReplaceJapaneseCharacters() {
        String raw = "<think>内部推論</think>「聞く」&amp;「話す」";
        String sanitized = AiSenseiBenchmarkResponder.sanitize(raw);

        assertEquals("内部推論「聞く」&「話す」", sanitized);
        assertTrue(AiSenseiBenchmarkDiagnostic.suspiciousCodePoints(sanitized).isEmpty());
        assertFalse(sanitized.contains("�"));
    }

    private static AiSenseiBenchmarkEvaluator.CaseResult result(
            AiSenseiBenchmarkCase benchmarkCase,
            int score,
            String response) {
        int fact = Math.min(3, score);
        int remaining = score - fact;
        int completeness = Math.min(2, remaining);
        remaining -= completeness;
        int naturalness = Math.min(2, remaining);
        remaining -= naturalness;
        int terminology = Math.min(1, remaining);
        remaining -= terminology;
        int register = Math.min(1, remaining);
        remaining -= register;
        int clarity = Math.min(1, remaining);
        AiSenseiBenchmarkEvaluator.ScoreBreakdown breakdown =
                new AiSenseiBenchmarkEvaluator.ScoreBreakdown(
                        fact, completeness, naturalness, terminology, register, clarity,
                        false, List.of());
        return new AiSenseiBenchmarkEvaluator.CaseResult(benchmarkCase, response, breakdown);
    }

    private static AiSenseiBenchmarkDiagnostic diagnostic(
            String caseId,
            String raw,
            String sanitized,
            String requestedModel,
            String actualModel) {
        return new AiSenseiBenchmarkDiagnostic(
                caseId,
                "OPENROUTER",
                requestedModel,
                actualModel,
                null,
                false,
                "stop",
                123,
                0,
                10L,
                20L,
                30L,
                "{\"model\":\"" + actualModel + "\"}",
                null,
                raw,
                sanitized,
                AiSenseiBenchmarkDiagnostic.suspiciousCodePoints(raw),
                AiSenseiBenchmarkDiagnostic.suspiciousCodePoints(sanitized),
                null);
    }
}

package com.midori.ai.benchmark;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;

/** Writes the optional live AI Sensei benchmark reports under {@code target/ai-benchmark/}. */
public final class AiSenseiBenchmarkReport {

    public static final Path DEFAULT_OUTPUT_DIR = Paths.get("target", "ai-benchmark");
    private static final String COMPARISON_BASE = "ai-sensei-model-comparison";

    private final ObjectMapper jsonMapper;

    public AiSenseiBenchmarkReport() {
        this.jsonMapper = new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    public Map<String, Object> buildReport(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName) {
        return buildReport(dataset, results, runnerName, List.of());
    }

    public Map<String, Object> buildReport(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName,
            List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        Objects.requireNonNull(dataset, "dataset");
        Objects.requireNonNull(results, "results");
        diagnostics = diagnostics == null ? List.of() : List.copyOf(diagnostics);

        int totalScore = results.stream().mapToInt(r -> r.score).sum();
        int maxScore = results.stream().mapToInt(r -> r.benchmarkCase.getMaxScore()).sum();
        double percent = maxScore == 0 ? 0.0 : 100.0 * totalScore / maxScore;
        Map<String, Integer> counts = verdictCounts(results);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("runner", runnerName);
        report.put("generatedAt", Instant.now().toString());
        report.put("datasetName", dataset.getName());
        report.put("totalCases", results.size());
        report.put("totalScore", totalScore);
        report.put("maxScore", maxScore);
        report.put("percentage", round2(percent));
        report.put("counts", counts);
        report.put("overallHealthy", isOverallHealthy(percent, counts));

        Map<String, Map<String, Object>> byCategory = new LinkedHashMap<>();
        for (Map.Entry<String, List<AiSenseiBenchmarkCase>> entry : dataset.groupByCategory().entrySet()) {
            byCategory.put(entry.getKey(), summariseGroup(entry.getValue(), results));
        }
        report.put("byCategory", byCategory);

        Map<String, Map<String, Object>> byLevel = new LinkedHashMap<>();
        for (Map.Entry<String, List<AiSenseiBenchmarkCase>> entry : dataset.groupByLevel().entrySet()) {
            byLevel.put(entry.getKey(), summariseGroup(entry.getValue(), results));
        }
        report.put("byLevel", byLevel);

        List<Map<String, Object>> forbiddenHits = forbiddenHits(results);
        report.put("forbiddenClaimsDetected", forbiddenHits);
        report.put("forbiddenClaimCount", results.stream()
                .mapToInt(r -> r.breakdown.forbiddenHits.size()).sum());

        List<Map<String, Object>> recurring = recurringPatterns(results, diagnostics);
        report.put("recurringFailurePatterns", recurring);
        report.put("lowestScoringCases", lowestCases(results));

        Map<String, Object> modelIdentity = modelIdentity(diagnostics);
        report.put("modelIdentity", modelIdentity);
        report.put("averageLatencyMs", averageLatency(diagnostics));
        report.put("errorOrRetryCount", diagnostics.stream()
                .mapToInt(AiSenseiBenchmarkDiagnostic::errorOrRetryCount).sum());
        report.put("tokenUsage", tokenUsage(results, diagnostics));

        int rawMalformed = diagnostics.stream()
                .mapToInt(d -> d.rawSuspiciousCodePoints().size()).sum();
        int sanitizedMalformed = diagnostics.stream()
                .mapToInt(d -> d.sanitizedSuspiciousCodePoints().size()).sum();
        int finalMalformed = results.stream()
                .mapToInt(r -> AiSenseiBenchmarkDiagnostic.suspiciousCount(r.aiResponse)).sum();
        int httpUtf8DecodeFailures = (int) diagnostics.stream()
                .filter(d -> d.error() != null && d.error().contains("Malformed UTF-8"))
                .count();
        Map<String, Object> integrity = new LinkedHashMap<>();
        integrity.put("rawProviderMalformedCharacterCount", rawMalformed);
        integrity.put("sanitizedMalformedCharacterCount", sanitizedMalformed);
        integrity.put("finalReportMalformedCharacterCount", finalMalformed);
        integrity.put("httpUtf8DecodeFailureCount", httpUtf8DecodeFailures);
        integrity.put("malformedIntroducedBetweenRawAndFinal", finalMalformed > rawMalformed);
        integrity.put("rawAndSanitizedResponsesEqual", diagnostics.stream().allMatch(d ->
                Objects.equals(d.rawProviderResponse(), d.sanitizedResponse())));
        report.put("characterIntegrity", integrity);
        report.put("malformedCharacterCount", finalMalformed);

        Recommendation recommendation = classifyRootCause(results, diagnostics, percent, counts,
                rawMalformed, sanitizedMalformed, finalMalformed, httpUtf8DecodeFailures);
        report.put("promptChangeRecommended", recommendation.promptChangeRecommended());
        report.put("modelChangeRecommended", recommendation.modelChangeRecommended());
        report.put("encodingInvestigationRecommended", recommendation.encodingInvestigationRecommended());
        report.put("providerReliabilityIssue", recommendation.providerReliabilityIssue());
        report.put("rootCauseSummary", recommendation.rootCauseSummary());
        report.put("recommendationReason", recommendation.rootCauseSummary());

        Map<String, AiSenseiBenchmarkDiagnostic> diagnosticById = new LinkedHashMap<>();
        for (AiSenseiBenchmarkDiagnostic diagnostic : diagnostics) {
            diagnosticById.put(diagnostic.caseId(), diagnostic);
        }
        List<Map<String, Object>> caseDetails = new ArrayList<>();
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", result.benchmarkCase.getId());
            row.put("category", result.benchmarkCase.getCategory());
            row.put("level", result.benchmarkCase.getLevel());
            row.put("prompt", result.benchmarkCase.getPrompt());
            row.put("aiResponse", result.aiResponse);
            row.put("finalReportResponse", result.aiResponse);
            row.put("score", result.score);
            row.put("verdict", result.verdict);
            row.put("reason", buildReason(result));
            row.put("factAccuracy", result.breakdown.factAccuracy);
            row.put("completeness", result.breakdown.completeness);
            row.put("naturalness", result.breakdown.naturalness);
            row.put("terminologyPrecision", result.breakdown.terminologyPrecision);
            row.put("registerAppropriateness", result.breakdown.registerAppropriateness);
            row.put("clarityForLearners", result.breakdown.clarityForLearners);
            row.put("forbiddenClaims", result.breakdown.forbiddenHits);
            AiSenseiBenchmarkDiagnostic diagnostic = diagnosticById.get(result.benchmarkCase.getId());
            if (diagnostic != null) row.put("diagnostic", diagnostic);
            caseDetails.add(row);
        }
        report.put("caseDetails", caseDetails);
        return report;
    }

    static String buildReason(AiSenseiBenchmarkEvaluator.CaseResult result) {
        if (!result.breakdown.forbiddenHits.isEmpty()) {
            return "Forbidden claim(s) detected: " + String.join("; ", result.breakdown.forbiddenHits);
        }
        if (result.aiResponse == null || result.aiResponse.isBlank()) return "Empty response";
        if (result.score >= 9) return "Strong coverage of expected facts; terminology aligned";
        if (result.score >= 7) return "Mostly aligned; minor terminology or naturalness gaps";
        if (result.score >= 4) return "Significant gaps in expected facts or terminology";
        return "Score too low; response diverges from expected facts";
    }

    public Path writeToTargetCanonical(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName) throws IOException {
        return writeToCanonical(dataset, results, runnerName, List.of(), DEFAULT_OUTPUT_DIR);
    }

    public Path writeToTargetCanonical(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName,
            List<AiSenseiBenchmarkDiagnostic> diagnostics) throws IOException {
        return writeToCanonical(dataset, results, runnerName, diagnostics, DEFAULT_OUTPUT_DIR);
    }

    public Path writeToCanonical(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName,
            Path outputDir) throws IOException {
        return writeToCanonical(dataset, results, runnerName, List.of(), outputDir);
    }

    public Path writeToCanonical(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName,
            List<AiSenseiBenchmarkDiagnostic> diagnostics,
            Path outputDir) throws IOException {
        Files.createDirectories(outputDir);
        Map<String, Object> report = buildReport(dataset, results, runnerName, diagnostics);
        boolean smoke = dataset.getName().contains("smoke");
        String base = smoke ? "ai-sensei-smoke-report" : "ai-sensei-full-report";
        writeReportFiles(report, dataset, results, outputDir, base);

        String requestedModel = firstRequestedModel(diagnostics);
        if (smoke && requestedModel != null && !requestedModel.isBlank()) {
            writeReportFiles(report, dataset, results, outputDir, base + "-" + slug(requestedModel));
            writeComparisonReport(outputDir);
        }
        return outputDir;
    }

    public Path writeToTarget(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName) throws IOException {
        return writeTo(dataset, results, runnerName, DEFAULT_OUTPUT_DIR);
    }

    public Path writeTo(
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            String runnerName,
            Path outputDir) throws IOException {
        Files.createDirectories(outputDir);
        Map<String, Object> report = buildReport(dataset, results, runnerName);
        String base = "ai-sensei-benchmark-"
                + dataset.getName().replace(".json", "")
                + "-" + Instant.now().toString().replace(':', '-');
        writeReportFiles(report, dataset, results, outputDir, base);
        return outputDir;
    }

    private void writeReportFiles(
            Map<String, Object> report,
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            Path outputDir,
            String base) throws IOException {
        Path jsonPath = outputDir.resolve(base + ".json");
        Path markdownPath = outputDir.resolve(base + ".md");
        byte[] jsonBytes = jsonMapper.writeValueAsBytes(report);
        Files.write(jsonPath, jsonBytes);
        Files.writeString(markdownPath, renderMarkdown(report, dataset, results), StandardCharsets.UTF_8);
        verifySerializedResponses(jsonPath, report);
    }

    private void verifySerializedResponses(Path jsonPath, Map<String, Object> sourceReport) throws IOException {
        Map<String, Object> roundTripped = jsonMapper.readValue(
                Files.readAllBytes(jsonPath), new TypeReference<Map<String, Object>>() { });
        List<Map<String, Object>> sourceCases = castRows(sourceReport.get("caseDetails"));
        List<Map<String, Object>> finalCases = castRows(roundTripped.get("caseDetails"));
        if (sourceCases.size() != finalCases.size()) {
            throw new IOException("Report serialization changed the case count for " + jsonPath);
        }
        for (int i = 0; i < sourceCases.size(); i++) {
            Object source = sourceCases.get(i).get("finalReportResponse");
            Object serialized = finalCases.get(i).get("finalReportResponse");
            if (!Objects.equals(source, serialized)) {
                throw new IOException("Report serialization changed response text for case "
                        + sourceCases.get(i).get("id"));
            }
        }
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> castRows(Object value) {
        return value instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }

    private void writeComparisonReport(Path outputDir) throws IOException {
        List<Map<String, Object>> summaries = new ArrayList<>();
        try (var paths = Files.list(outputDir)) {
            List<Path> reports = paths
                    .filter(path -> path.getFileName().toString().startsWith("ai-sensei-smoke-report-"))
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .sorted()
                    .toList();
            for (Path path : reports) {
                Map<String, Object> report = jsonMapper.readValue(
                        Files.readAllBytes(path), new TypeReference<Map<String, Object>>() { });
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("modelId", nested(report, "modelIdentity", "requestedModel"));
                row.put("actualResolvedModels", nested(report, "modelIdentity", "actualResolvedModels"));
                row.put("provider", nested(report, "modelIdentity", "provider"));
                row.put("score", report.get("totalScore"));
                row.put("maxScore", report.get("maxScore"));
                row.put("percentage", report.get("percentage"));
                row.put("counts", report.get("counts"));
                row.put("malformedCharacterCount", report.get("malformedCharacterCount"));
                row.put("forbiddenClaimCount", report.get("forbiddenClaimCount"));
                row.put("averageLatencyMs", report.get("averageLatencyMs"));
                row.put("tokenUsage", report.get("tokenUsage"));
                row.put("recurringFailurePatterns", report.get("recurringFailurePatterns"));
                Map<String, Object> recommendation = new LinkedHashMap<>();
                recommendation.put("promptChangeRecommended", report.get("promptChangeRecommended"));
                recommendation.put("modelChangeRecommended", report.get("modelChangeRecommended"));
                recommendation.put("encodingInvestigationRecommended", report.get("encodingInvestigationRecommended"));
                recommendation.put("providerReliabilityIssue", report.get("providerReliabilityIssue"));
                recommendation.put("rootCauseSummary", report.get("rootCauseSummary"));
                row.put("recommendation", recommendation);
                row.put("sourceReport", path.getFileName().toString());
                summaries.add(row);
            }
        }
        if (summaries.isEmpty()) return;

        Map<String, Object> comparison = new LinkedHashMap<>();
        comparison.put("generatedAt", Instant.now().toString());
        comparison.put("dataset", "20-case smoke benchmark only");
        comparison.put("models", summaries);
        Files.write(outputDir.resolve(COMPARISON_BASE + ".json"), jsonMapper.writeValueAsBytes(comparison));

        StringBuilder markdown = new StringBuilder("# AI Sensei Smoke Model Comparison\n\n");
        markdown.append("Generated: ").append(comparison.get("generatedAt")).append("\n\n");
        markdown.append("| Model | Score | PASS | MINOR | MAJOR | FAIL | Malformed | Forbidden | Avg latency |\n");
        markdown.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|\n");
        for (Map<String, Object> row : summaries) {
            @SuppressWarnings("unchecked")
            Map<String, Object> counts = (Map<String, Object>) row.get("counts");
            markdown.append("| ").append(row.get("modelId"))
                    .append(" | ").append(row.get("score")).append('/').append(row.get("maxScore"))
                    .append(" | ").append(counts.get("pass"))
                    .append(" | ").append(counts.get("minorIssue"))
                    .append(" | ").append(counts.get("majorIssue"))
                    .append(" | ").append(counts.get("fail"))
                    .append(" | ").append(row.get("malformedCharacterCount"))
                    .append(" | ").append(row.get("forbiddenClaimCount"))
                    .append(" | ").append(row.get("averageLatencyMs")).append(" ms |\n");
        }
        markdown.append("\n## Recommendations\n\n");
        for (Map<String, Object> row : summaries) {
            @SuppressWarnings("unchecked")
            Map<String, Object> recommendation = (Map<String, Object>) row.get("recommendation");
            markdown.append("- **").append(row.get("modelId")).append(":** ")
                    .append(recommendation.get("rootCauseSummary")).append('\n');
        }
        Files.writeString(outputDir.resolve(COMPARISON_BASE + ".md"), markdown, StandardCharsets.UTF_8);
    }

    private static Object nested(Map<String, Object> report, String parent, String child) {
        Object value = report.get(parent);
        if (!(value instanceof Map<?, ?> map)) return null;
        return map.get(child);
    }

    String renderMarkdown(
            Map<String, Object> report,
            AiSenseiBenchmarkDataset dataset,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results) {
        StringBuilder text = new StringBuilder("# AI Sensei Benchmark Report\n\n");
        text.append("- Generated: ").append(report.get("generatedAt")).append('\n');
        text.append("- Runner: ").append(report.get("runner")).append('\n');
        text.append("- Dataset: ").append(report.get("datasetName")).append('\n');
        text.append("- Score: ").append(report.get("totalScore")).append(" / ")
                .append(report.get("maxScore")).append(" (").append(report.get("percentage")).append("%)\n");
        text.append("- Overall healthy: ").append(report.get("overallHealthy")).append("\n\n");

        @SuppressWarnings("unchecked")
        Map<String, Object> identity = (Map<String, Object>) report.get("modelIdentity");
        text.append("## Model and Provider\n\n");
        text.append("- Requested model: ").append(identity.get("requestedModel")).append('\n');
        text.append("- Actual resolved models: ").append(identity.get("actualResolvedModels")).append('\n');
        text.append("- Provider: ").append(identity.get("provider")).append('\n');
        text.append("- Fallback occurred: ").append(identity.get("fallbackOccurred")).append('\n');
        text.append("- Fallback models: ").append(identity.get("fallbackModelsUsed")).append('\n');
        text.append("- Finish reasons: ").append(identity.get("finishReasons")).append('\n');
        text.append("- Average latency: ").append(report.get("averageLatencyMs")).append(" ms\n");
        text.append("- Errors/retries: ").append(report.get("errorOrRetryCount")).append("\n\n");

        @SuppressWarnings("unchecked")
        Map<String, Integer> counts = (Map<String, Integer>) report.get("counts");
        text.append("## Results\n\n");
        text.append("- PASS=").append(counts.get("pass"))
                .append(", MINOR=").append(counts.get("minorIssue"))
                .append(", MAJOR=").append(counts.get("majorIssue"))
                .append(", FAIL=").append(counts.get("fail")).append("\n");
        text.append("- Malformed characters: ").append(report.get("malformedCharacterCount")).append('\n');
        text.append("- Forbidden claims: ").append(report.get("forbiddenClaimCount")).append("\n\n");

        text.append("## Recommendation\n\n");
        text.append("- Prompt change recommended: ").append(report.get("promptChangeRecommended")).append('\n');
        text.append("- Model change recommended: ").append(report.get("modelChangeRecommended")).append('\n');
        text.append("- Encoding investigation recommended: ").append(report.get("encodingInvestigationRecommended")).append('\n');
        text.append("- Provider reliability issue: ").append(report.get("providerReliabilityIssue")).append('\n');
        text.append("- Root cause: ").append(report.get("rootCauseSummary")).append("\n\n");

        text.append("## Per-case Prompt and Response\n\n");
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            text.append("### ").append(result.benchmarkCase.getId()).append(" — ")
                    .append(result.benchmarkCase.getCategory()).append(" / ")
                    .append(result.benchmarkCase.getLevel()).append(" — ")
                    .append(result.score).append('/').append(result.benchmarkCase.getMaxScore())
                    .append(" — ").append(result.verdict).append("\n\n");
            text.append("**Question:**\n\n").append(result.benchmarkCase.getPrompt()).append("\n\n");
            String response = result.aiResponse == null ? "" : result.aiResponse;
            if (response.length() > 1500) response = response.substring(0, 1500) + "… [full text in JSON]";
            text.append("**AI response:**\n\n").append(response).append("\n\n");
            text.append("**Reason:** ").append(buildReason(result)).append("\n\n");
        }
        return text.toString();
    }

    private static Map<String, Integer> verdictCounts(List<AiSenseiBenchmarkEvaluator.CaseResult> results) {
        int pass = 0, minor = 0, major = 0, fail = 0;
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            switch (result.breakdown.verdict) {
                case PASS -> pass++;
                case MINOR_ISSUE -> minor++;
                case MAJOR_ISSUE -> major++;
                case FAIL -> fail++;
            }
        }
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("pass", pass);
        counts.put("minorIssue", minor);
        counts.put("majorIssue", major);
        counts.put("fail", fail);
        return counts;
    }

    private static boolean isOverallHealthy(double percentage, Map<String, Integer> counts) {
        return percentage >= 75.0
                && counts.get("pass") > 0
                && counts.get("fail") == 0;
    }

    private Map<String, Object> summariseGroup(
            List<AiSenseiBenchmarkCase> cases,
            List<AiSenseiBenchmarkEvaluator.CaseResult> results) {
        Set<String> ids = new LinkedHashSet<>();
        int max = 0;
        for (AiSenseiBenchmarkCase benchmarkCase : cases) {
            ids.add(benchmarkCase.getId());
            max += benchmarkCase.getMaxScore();
        }
        int score = results.stream()
                .filter(result -> ids.contains(result.benchmarkCase.getId()))
                .mapToInt(result -> result.score)
                .sum();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("cases", cases.size());
        summary.put("score", score);
        summary.put("maxScore", max);
        summary.put("percentage", max == 0 ? 0.0 : round2(100.0 * score / max));
        return summary;
    }

    private static List<Map<String, Object>> forbiddenHits(
            List<AiSenseiBenchmarkEvaluator.CaseResult> results) {
        List<Map<String, Object>> hits = new ArrayList<>();
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            if (result.breakdown.forbiddenHits.isEmpty()) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", result.benchmarkCase.getId());
            row.put("category", result.benchmarkCase.getCategory());
            row.put("level", result.benchmarkCase.getLevel());
            row.put("score", result.score);
            row.put("claims", result.breakdown.forbiddenHits);
            hits.add(row);
        }
        return hits;
    }

    private static List<Map<String, Object>> recurringPatterns(
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        Map<String, Integer> patterns = new TreeMap<>();
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            for (String hit : result.breakdown.forbiddenHits) patterns.merge(hit, 1, Integer::sum);
            if (result.aiResponse.isBlank()) patterns.merge("Empty provider response", 1, Integer::sum);
            if (result.score <= 3) patterns.merge("Severe basic-task inconsistency", 1, Integer::sum);
            if ("TRANSLATION".equals(result.benchmarkCase.getCategory()) && result.score <= 3) {
                patterns.merge("Translation meaning preservation failure", 1, Integer::sum);
            }
        }
        for (AiSenseiBenchmarkDiagnostic diagnostic : diagnostics) {
            if (!diagnostic.rawSuspiciousCodePoints().isEmpty()) {
                patterns.merge("Malformed Japanese in raw provider response", 1, Integer::sum);
            }
            if (diagnostic.rawSuspiciousCodePoints().isEmpty()
                    && !diagnostic.sanitizedSuspiciousCodePoints().isEmpty()) {
                patterns.merge("Malformed Japanese introduced by sanitizer", 1, Integer::sum);
            }
            if (diagnostic.error() != null) patterns.merge("Provider call error", 1, Integer::sum);
        }
        List<Map<String, Object>> recurring = new ArrayList<>();
        patterns.entrySet().stream()
                .filter(entry -> entry.getValue() >= 2)
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("pattern", entry.getKey());
                    row.put("occurrences", entry.getValue());
                    recurring.add(row);
                });
        return recurring;
    }

    private static List<Map<String, Object>> lowestCases(
            List<AiSenseiBenchmarkEvaluator.CaseResult> results) {
        return results.stream()
                .sorted(Comparator.comparingInt(result -> result.score))
                .limit(5)
                .map(result -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", result.benchmarkCase.getId());
                    row.put("category", result.benchmarkCase.getCategory());
                    row.put("level", result.benchmarkCase.getLevel());
                    row.put("score", result.score);
                    row.put("verdict", result.verdict);
                    return row;
                })
                .toList();
    }

    private static Map<String, Object> modelIdentity(List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        Set<String> providers = nonNullValues(diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::provider).toList());
        Set<String> requested = nonNullValues(diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::requestedModel).toList());
        Set<String> actual = nonNullValues(diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::actualResolvedModel).toList());
        Set<String> fallbackModels = nonNullValues(diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::fallbackModelUsed).toList());
        Map<String, Integer> finishReasons = new TreeMap<>();
        for (AiSenseiBenchmarkDiagnostic diagnostic : diagnostics) {
            if (diagnostic.finishReason() != null) finishReasons.merge(diagnostic.finishReason(), 1, Integer::sum);
        }
        Map<String, Object> identity = new LinkedHashMap<>();
        identity.put("provider", providers.size() == 1 ? providers.iterator().next() : providers);
        identity.put("requestedModel", requested.size() == 1 ? requested.iterator().next() : requested);
        identity.put("actualResolvedModels", actual);
        identity.put("fallbackModelsUsed", fallbackModels);
        identity.put("fallbackOccurred", diagnostics.stream().anyMatch(AiSenseiBenchmarkDiagnostic::fallbackOccurred));
        identity.put("finishReasons", finishReasons);
        return identity;
    }

    private static Set<String> nonNullValues(List<String> values) {
        Set<String> result = new LinkedHashSet<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) result.add(value);
        }
        return result;
    }

    private static double averageLatency(List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        if (diagnostics.isEmpty()) return 0.0;
        return round2(diagnostics.stream().mapToLong(AiSenseiBenchmarkDiagnostic::latencyMs).average().orElse(0.0));
    }

    private static Map<String, Object> tokenUsage(
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        long reportedPrompt = diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::promptTokens)
                .filter(Objects::nonNull).mapToLong(Long::longValue).sum();
        long reportedCompletion = diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::completionTokens)
                .filter(Objects::nonNull).mapToLong(Long::longValue).sum();
        long reportedTotal = diagnostics.stream().map(AiSenseiBenchmarkDiagnostic::totalTokens)
                .filter(Objects::nonNull).mapToLong(Long::longValue).sum();
        long reportedCases = diagnostics.stream().filter(d -> d.totalTokens() != null).count();
        long estimatedCompletion = results.stream()
                .mapToLong(result -> Math.max(1L, (result.aiResponse.codePointCount(0, result.aiResponse.length()) + 3L) / 4L))
                .sum();
        Map<String, Object> usage = new LinkedHashMap<>();
        usage.put("reportedPromptTokens", reportedPrompt);
        usage.put("reportedCompletionTokens", reportedCompletion);
        usage.put("reportedTotalTokens", reportedTotal);
        usage.put("reportedCases", reportedCases);
        usage.put("estimatedCompletionTokensWhenUnreported", estimatedCompletion);
        usage.put("estimateMethod", "Unicode code-point count divided by 4; informational only");
        return usage;
    }

    private static Recommendation classifyRootCause(
            List<AiSenseiBenchmarkEvaluator.CaseResult> results,
            List<AiSenseiBenchmarkDiagnostic> diagnostics,
            double percentage,
            Map<String, Integer> counts,
            int rawMalformed,
            int sanitizedMalformed,
            int finalMalformed,
            int httpUtf8DecodeFailures) {
        Map<String, Integer> instructionFailures = new TreeMap<>();
        int severeForbidden = 0;
        int translationFailures = 0;
        int emptyResponses = 0;
        for (AiSenseiBenchmarkEvaluator.CaseResult result : results) {
            if (result.aiResponse.isBlank()) emptyResponses++;
            for (String hit : result.breakdown.forbiddenHits) {
                instructionFailures.merge(hit, 1, Integer::sum);
                if (hit.toLowerCase(Locale.ROOT).contains("severe")) severeForbidden++;
            }
            if ("TRANSLATION".equals(result.benchmarkCase.getCategory()) && result.score <= 3) {
                translationFailures++;
            }
        }
        boolean recurringInstructionFailure = instructionFailures.values().stream().anyMatch(count -> count >= 3);
        boolean encodingIntroducedAfterRaw = httpUtf8DecodeFailures > 0
                || sanitizedMalformed > rawMalformed
                || finalMalformed > rawMalformed;
        int errorsAndRetries = diagnostics.stream()
                .mapToInt(d -> d.errorOrRetryCount() + (d.error() == null ? 0 : 1)).sum();
        boolean providerIssue = errorsAndRetries > 0
                || emptyResponses > 0
                || diagnostics.stream().anyMatch(AiSenseiBenchmarkDiagnostic::fallbackOccurred);
        boolean severeInconsistency = percentage < 50.0 && counts.get("pass") == 0;
        boolean modelIssue = rawMalformed > 0
                || severeForbidden > 0
                || translationFailures >= 2
                || severeInconsistency;

        String summary;
        if (encodingIntroducedAfterRaw) {
            summary = "Character corruption was introduced after the raw provider text; investigate HTTP/JSON/sanitizer/report encoding before changing prompts.";
        } else if (rawMalformed > 0) {
            summary = "Malformed Japanese is already present in the raw provider response. The sanitizer and UTF-8 report serialization preserve it, so model quality/routing is the primary issue.";
        } else if (providerIssue && severeInconsistency) {
            summary = "Provider retries or empty responses coincide with severe model inconsistency. Change the pinned model and address provider reliability; a prompt change alone is not justified.";
        } else if (modelIssue) {
            summary = "The model shows fabricated facts, translation loss, or severe inconsistency on basic Japanese tasks. Prefer a stable Japanese-capable pinned model.";
        } else if (recurringInstructionFailure) {
            summary = "The same explicit instruction-following failure recurs in at least three cases; a targeted prompt change may be justified.";
        } else {
            summary = "No recurring prompt failure or encoding mutation was detected; retain the prompt and continue model/provider monitoring.";
        }
        return new Recommendation(
                recurringInstructionFailure,
                modelIssue,
                encodingIntroducedAfterRaw,
                providerIssue,
                summary);
    }

    private static String firstRequestedModel(List<AiSenseiBenchmarkDiagnostic> diagnostics) {
        return diagnostics.stream()
                .map(AiSenseiBenchmarkDiagnostic::requestedModel)
                .filter(Objects::nonNull)
                .filter(model -> !model.isBlank())
                .findFirst()
                .orElse(null);
    }

    private static String slug(String model) {
        return model.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record Recommendation(
            boolean promptChangeRecommended,
            boolean modelChangeRecommended,
            boolean encodingInvestigationRecommended,
            boolean providerReliabilityIssue,
            String rootCauseSummary) {
    }
}

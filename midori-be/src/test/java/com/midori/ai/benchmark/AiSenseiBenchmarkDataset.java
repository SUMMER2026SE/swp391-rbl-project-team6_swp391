package com.midori.ai.benchmark;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.DeserializationFeature;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;

/**
 * Loads and validates the AI Sensei Japanese benchmark dataset.
 *
 * <p>The dataset is shipped as JSON resources under
 * {@code src/test/resources/ai-benchmark/}. This class enforces the structural
 * invariants required by the benchmark policy:
 *
 * <ul>
 *   <li>Exactly the configured case count (100 for the full set, 20 for the
 *       smoke set).</li>
 *   <li>Exactly the configured per-category count (10 for the full set).</li>
 *   <li>Unique case IDs.</li>
 *   <li>Recognised level codes (N5/N4/N3/N2/N1/non-JLPT).</li>
 *   <li>Non-empty expected facts and evaluation criteria.</li>
 *   <li>{@code maxScore} within an acceptable range.</li>
 * </ul>
 *
 * <p>Validation runs in {@link #loadAndValidate(String, int, int, String...)} —
 * the same method is reused by {@code mvn test} (validation only) and by the
 * optional live runner.
 */
public final class AiSenseiBenchmarkDataset {

    /** Canonical category list for the 100-case benchmark. */
    public static final List<String> FULL_CATEGORIES = List.of(
            "GRAMMAR",
            "PARTICLES",
            "VERB_BEHAVIOR",
            "TRANSITIVE_INTRANSITIVE",
            "TRANSLATION",
            "CORRECTION",
            "KANJI",
            "KEIGO",
            "WRITING_CONVERSATION",
            "JLPT_ADVANCED"
    );

    /** Canonical level list. */
    public static final List<String> LEVELS = List.of(
            "N5", "N4", "N3", "N2", "N1", "non-JLPT"
    );

    private final List<AiSenseiBenchmarkCase> cases;
    private final String name;

    private AiSenseiBenchmarkDataset(String name, List<AiSenseiBenchmarkCase> cases) {
        this.name = name;
        this.cases = List.copyOf(cases);
    }

    public String getName() {
        return name;
    }

    public List<AiSenseiBenchmarkCase> cases() {
        return cases;
    }

    public int size() {
        return cases.size();
    }

    /**
     * Load and validate a benchmark dataset from a JSON resource on the test
     * classpath.
     *
     * @param resourcePath       JSON resource path (e.g.
     *                           {@code ai-benchmark/ai-sensei-benchmark.json}).
     * @param expectedTotal      total expected case count (100 for the full set,
     *                           20 for the smoke set).
     * @param expectedPerCategory expected per-category count; the smoke set is
     *                           allowed to be heterogeneous so it can be set to
     *                           0 in that case.
     * @param expectedCategories categories that must appear in the dataset;
     *                           pass {@link #FULL_CATEGORIES} for the full set
     *                           and an empty list for the smoke set.
     * @return a fully validated dataset.
     */
    public static AiSenseiBenchmarkDataset loadAndValidate(
            String resourcePath,
            int expectedTotal,
            int expectedPerCategory,
            String... expectedCategories
    ) {
        Objects.requireNonNull(resourcePath, "resourcePath");

        ObjectMapper mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        CollectionType listType = mapper.getTypeFactory()
                .constructCollectionType(List.class, AiSenseiBenchmarkCase.class);

        List<AiSenseiBenchmarkCase> loaded;
        try (InputStream in = openResource(resourcePath)) {
            if (in == null) {
                throw new IllegalStateException(
                        "Benchmark resource not found on classpath: " + resourcePath);
            }
            loaded = mapper.readValue(in, listType);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to read benchmark resource: " + resourcePath, e);
        }

        if (loaded == null) {
            loaded = List.of();
        }

        validate(loaded, expectedTotal, expectedPerCategory, expectedCategories);

        return new AiSenseiBenchmarkDataset(
                resourcePath.substring(resourcePath.lastIndexOf('/') + 1),
                loaded);
    }

    private static InputStream openResource(String resourcePath) {
        ClassLoader cl = AiSenseiBenchmarkDataset.class.getClassLoader();
        if (cl != null) {
            InputStream in = cl.getResourceAsStream(resourcePath);
            if (in != null) {
                return in;
            }
        }
        // Fall back to context-relative resources (used in some IDE workflows).
        return Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath);
    }

    private static void validate(
            List<AiSenseiBenchmarkCase> cases,
            int expectedTotal,
            int expectedPerCategory,
            String... expectedCategories
    ) {
        if (cases.size() != expectedTotal) {
            throw new IllegalStateException(
                    "Benchmark dataset must contain exactly " + expectedTotal
                            + " cases, but contains " + cases.size());
        }

        // Unique IDs.
        Set<String> ids = new HashSet<>();
        for (AiSenseiBenchmarkCase c : cases) {
            if (!ids.add(c.getId())) {
                throw new IllegalStateException(
                        "Duplicate benchmark case id: " + c.getId());
            }
        }

        // Per-category counts.
        Map<String, Integer> perCategory = new LinkedHashMap<>();
        for (String cat : expectedCategories) {
            perCategory.put(cat, 0);
        }
        for (AiSenseiBenchmarkCase c : cases) {
            String cat = c.getCategory();
            if (expectedCategories.length > 0
                    && !perCategory.containsKey(cat)) {
                throw new IllegalStateException(
                        "Unknown category '" + cat + "' on case " + c.getId()
                                + ". Allowed: " + java.util.Arrays.asList(expectedCategories));
            }
            perCategory.merge(cat, 1, Integer::sum);
        }
        if (expectedPerCategory > 0) {
            for (Map.Entry<String, Integer> e : perCategory.entrySet()) {
                if (e.getValue() != expectedPerCategory) {
                    throw new IllegalStateException(
                            "Category '" + e.getKey() + "' must have exactly "
                                    + expectedPerCategory + " cases, has "
                                    + e.getValue());
                }
            }
        }

        // Per-case field validation.
        for (AiSenseiBenchmarkCase c : cases) {
            if (c.getPrompt().isBlank()) {
                throw new IllegalStateException(
                        "Case " + c.getId() + " has blank prompt");
            }
            if (c.getExpectedFacts().isEmpty()) {
                throw new IllegalStateException(
                        "Case " + c.getId() + " has empty expectedFacts");
            }
            if (c.getEvaluationCriteria().isEmpty()) {
                throw new IllegalStateException(
                        "Case " + c.getId() + " has empty evaluationCriteria");
            }
            if (c.getMaxScore() < 1 || c.getMaxScore() > 10) {
                throw new IllegalStateException(
                        "Case " + c.getId()
                                + " has invalid maxScore: " + c.getMaxScore());
            }
            String level = c.getLevel();
            if (level == null || level.isBlank()) {
                throw new IllegalStateException(
                        "Case " + c.getId() + " has blank level");
            }
            // Levels are case-sensitive and must match the canonical set.
            if (!LEVELS.contains(level)) {
                throw new IllegalStateException(
                        "Case " + c.getId() + " has invalid level '"
                                + level + "'. Allowed: " + LEVELS);
            }
        }
    }

    /**
     * Group cases by category. The returned map preserves the iteration order
     * of {@link #FULL_CATEGORIES}.
     */
    public Map<String, List<AiSenseiBenchmarkCase>> groupByCategory() {
        Map<String, List<AiSenseiBenchmarkCase>> grouped = new LinkedHashMap<>();
        for (String cat : FULL_CATEGORIES) {
            grouped.put(cat, new ArrayList<>());
        }
        for (AiSenseiBenchmarkCase c : cases) {
            grouped.computeIfAbsent(c.getCategory(), k -> new ArrayList<>()).add(c);
        }
        // Remove empty categories to keep the report tidy.
        Map<String, List<AiSenseiBenchmarkCase>> cleaned = new LinkedHashMap<>();
        for (Map.Entry<String, List<AiSenseiBenchmarkCase>> e : grouped.entrySet()) {
            if (!e.getValue().isEmpty()) {
                cleaned.put(e.getKey(), e.getValue());
            }
        }
        return cleaned;
    }

    /** Group cases by level. */
    public Map<String, List<AiSenseiBenchmarkCase>> groupByLevel() {
        Map<String, List<AiSenseiBenchmarkCase>> grouped = new LinkedHashMap<>();
        for (String lv : LEVELS) {
            grouped.put(lv, new ArrayList<>());
        }
        for (AiSenseiBenchmarkCase c : cases) {
            grouped.computeIfAbsent(c.getLevel(), k -> new ArrayList<>()).add(c);
        }
        Map<String, List<AiSenseiBenchmarkCase>> cleaned = new LinkedHashMap<>();
        for (Map.Entry<String, List<AiSenseiBenchmarkCase>> e : grouped.entrySet()) {
            if (!e.getValue().isEmpty()) {
                cleaned.put(e.getKey(), e.getValue());
            }
        }
        return cleaned;
    }

    /** Aggregate category counts for quick inspection. */
    public Map<String, Integer> categoryCounts() {
        Map<String, Integer> counts = new TreeMap<>();
        for (AiSenseiBenchmarkCase c : cases) {
            counts.merge(c.getCategory(), 1, Integer::sum);
        }
        return counts;
    }

    /** Aggregate level counts for quick inspection. */
    public Map<String, Integer> levelCounts() {
        Map<String, Integer> counts = new TreeMap<>();
        for (String lv : LEVELS) {
            counts.put(lv, 0);
        }
        for (AiSenseiBenchmarkCase c : cases) {
            counts.merge(c.getLevel(), 1, Integer::sum);
        }
        return counts;
    }

    /** Collect all forbidden claims across the dataset. */
    public Collection<String> allForbiddenClaims() {
        Set<String> all = new HashSet<>();
        for (AiSenseiBenchmarkCase c : cases) {
            all.addAll(c.getForbiddenClaims());
        }
        return all;
    }
}
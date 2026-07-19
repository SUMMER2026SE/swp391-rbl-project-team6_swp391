package com.midori.ai.benchmark;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * A single benchmark case used to evaluate AI Sensei's Japanese output quality.
 *
 * <p>Each case is intentionally content-agnostic: the benchmark never requires an
 * exact answer string, only concepts, expected core facts, and explicit forbidden
 * claims. Scoring is performed by {@link AiSenseiBenchmarkEvaluator}.
 *
 * <p>The data is loaded from JSON test resources so the benchmark is fully
 * inspectable and editable without recompilation.
 */
public final class AiSenseiBenchmarkCase {

    private final String id;
    private final String category;
    private final String level;
    private final String prompt;
    private final List<String> expectedFacts;
    private final List<String> forbiddenClaims;
    private final List<String> evaluationCriteria;
    private final int maxScore;

    @JsonCreator
    public AiSenseiBenchmarkCase(
            @JsonProperty("id") String id,
            @JsonProperty("category") String category,
            @JsonProperty("level") String level,
            @JsonProperty("prompt") String prompt,
            @JsonProperty("expectedFacts") List<String> expectedFacts,
            @JsonProperty("forbiddenClaims") List<String> forbiddenClaims,
            @JsonProperty("evaluationCriteria") List<String> evaluationCriteria,
            @JsonProperty("maxScore") Integer maxScore) {
        this.id = Objects.requireNonNull(id, "id");
        this.category = Objects.requireNonNull(category, "category");
        this.level = Objects.requireNonNull(level, "level");
        this.prompt = Objects.requireNonNull(prompt, "prompt");
        this.expectedFacts = expectedFacts == null ? List.of() : List.copyOf(expectedFacts);
        this.forbiddenClaims = forbiddenClaims == null ? List.of() : List.copyOf(forbiddenClaims);
        this.evaluationCriteria = evaluationCriteria == null
                ? List.of()
                : List.copyOf(evaluationCriteria);
        this.maxScore = maxScore == null ? 10 : maxScore;
    }

    public String getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public String getLevel() {
        return level;
    }

    public String getPrompt() {
        return prompt;
    }

    public List<String> getExpectedFacts() {
        return Collections.unmodifiableList(expectedFacts);
    }

    public List<String> getForbiddenClaims() {
        return Collections.unmodifiableList(forbiddenClaims);
    }

    public List<String> getEvaluationCriteria() {
        return Collections.unmodifiableList(evaluationCriteria);
    }

    public int getMaxScore() {
        return maxScore;
    }

    @Override
    public String toString() {
        return "AiSenseiBenchmarkCase{" +
                "id='" + id + '\'' +
                ", category='" + category + '\'' +
                ", level='" + level + '\'' +
                ", maxScore=" + maxScore +
                ", expectedFacts=" + expectedFacts.size() +
                ", forbiddenClaims=" + forbiddenClaims.size() +
                ", evaluationCriteria=" + evaluationCriteria.size() +
                '}';
    }
}
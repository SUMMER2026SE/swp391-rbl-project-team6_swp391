package com.midori.ai.core;

/**
 * Dynamic time budget policy and output token cap calculator for AI operations.
 * Manages total backend request budgets and per-provider absolute call timeouts based on requested question counts.
 */
public final class AiTimeoutPolicy {

    public static final long SAFETY_MARGIN_MS = 5000L;
    public static final long MAX_TOTAL_BUDGET_MS = 170000L;
    public static final long MAX_PROVIDER_TIMEOUT_MS = 120000L;
    public static final int MAX_OUTPUT_TOKENS_CAP = 8192;

    private AiTimeoutPolicy() {}

    /**
     * Calculate total backend request budget in milliseconds.
     * Formula: min(60000 + (6000 * count), 170000).
     * Examples: 1 -> 66s, 5 -> 90s, 10 -> 120s, >=20 -> 170s.
     */
    public static long calculateTotalRequestBudgetMs(int requestedQuestionCount) {
        if (requestedQuestionCount <= 0) {
            return 60000L;
        }
        long baseBudgetMs = 60000L;
        long perQuestionMs = 6000L * requestedQuestionCount;
        return Math.min(baseBudgetMs + perQuestionMs, MAX_TOTAL_BUDGET_MS);
    }

    /**
     * Calculate per-provider call absolute timeout in milliseconds.
     */
    public static long calculateProviderTimeoutMs(int currentBatchQuestionCount, long remainingBackendBudgetMs) {
        return calculateProviderTimeoutMs(currentBatchQuestionCount, remainingBackendBudgetMs, null);
    }

    /**
     * Calculate per-provider call absolute timeout in milliseconds with task type awareness.
     * For question generation tasks: min(120000, remainingBackendBudgetMs - 5000).
     * For unrelated lightweight tasks: min(45000 + 5000 * batchCount, 120000, remainingBackendBudgetMs - 5000).
     */
    public static long calculateProviderTimeoutMs(int currentBatchQuestionCount, long remainingBackendBudgetMs, com.midori.ai.AiTaskType taskType) {
        long budgetConstrained = remainingBackendBudgetMs - SAFETY_MARGIN_MS;
        if (budgetConstrained < 1000L) {
            budgetConstrained = 1000L; // Safety fallback before early abort rejection
        }
        if (isQuestionGenerationTask(taskType)) {
            return Math.min(MAX_PROVIDER_TIMEOUT_MS, budgetConstrained);
        }
        if (currentBatchQuestionCount <= 0) {
            currentBatchQuestionCount = 1; // Default minimum
        }
        long nominalMs = 45000L + (5000L * currentBatchQuestionCount);
        long boundedNominal = Math.min(nominalMs, MAX_PROVIDER_TIMEOUT_MS);
        return Math.min(boundedNominal, budgetConstrained);
    }

    /**
     * Identify whether the task type represents an AI question generation task, including:
     * - COMPLEX_REASONING (WRITING, Vocabulary, Grammar, Reading question generation)
     * - ADMIN_CONTENT_LIBRARY_GENERATION (Admin question generation)
     * - LONG_DOCUMENT_ANALYSIS (PDF question generation / exam parsing)
     */
    public static boolean isQuestionGenerationTask(com.midori.ai.AiTaskType taskType) {
        if (taskType == null) {
            return false;
        }
        return taskType == com.midori.ai.AiTaskType.COMPLEX_REASONING
                || taskType == com.midori.ai.AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION
                || taskType == com.midori.ai.AiTaskType.LONG_DOCUMENT_ANALYSIS;
    }

    /**
     * Calculate a safe max output token limit from batch size.
     * Large enough to avoid truncated JSON while optimizing provider latency on small batches.
     */
    public static int calculateMaxOutputTokens(int batchSize) {
        if (batchSize <= 0) {
            return 2048;
        }
        int tokens = 500 + (600 * batchSize);
        return Math.min(tokens, MAX_OUTPUT_TOKENS_CAP);
    }

    /**
     * Check whether remaining backend request budget is sufficient to start a new provider call.
     * If remaining budget is less than safetyMarginMs (5000 ms), returns false.
     */
    public static boolean hasEnoughBudget(long remainingBackendBudgetMs) {
        return remainingBackendBudgetMs >= SAFETY_MARGIN_MS;
    }
}

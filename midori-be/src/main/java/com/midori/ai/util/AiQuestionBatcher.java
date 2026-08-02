package com.midori.ai.util;

import com.midori.ai.dto.WritingMode;
import com.midori.entity.Difficulty;

import java.util.*;

/**
 * Deterministic question batching and difficulty/mode distribution utility.
 * Enforces a generation batch limit of MAX_QUESTIONS_PER_AI_CALL = 10,
 * ensuring that total distribution counts match original request parameters without rounding loss.
 */
public final class AiQuestionBatcher {

    public static final int MAX_QUESTIONS_PER_AI_CALL = 10;

    private AiQuestionBatcher() {}

    /**
     * Determine batch sizes for a total requested question count.
     * E.g. 5 -> [5], 10 -> [10], 11 -> [10, 1], 25 -> [10, 10, 5].
     * Requests of 10 or fewer are never split.
     */
    public static List<Integer> createBatchSizes(int totalCount) {
        if (totalCount <= 0) {
            return Collections.emptyList();
        }
        if (totalCount <= MAX_QUESTIONS_PER_AI_CALL) {
            return List.of(totalCount);
        }
        List<Integer> batches = new ArrayList<>();
        int remaining = totalCount;
        while (remaining > 0) {
            int batchSize = Math.min(MAX_QUESTIONS_PER_AI_CALL, remaining);
            batches.add(batchSize);
            remaining -= batchSize;
        }
        return batches;
    }

    /**
     * Distribute difficulty counts across batches deterministically using largest-remainder allocation.
     * The sum across all batches exactly equals the original requested distribution with zero rounding loss.
     */
    public static List<Map<Difficulty, Integer>> createDifficultyBatches(Map<Difficulty, Integer> totalDistribution, int maxPerBatch) {
        int totalCount = totalDistribution.values().stream().mapToInt(Integer::intValue).sum();
        if (totalCount <= maxPerBatch) {
            return List.of(new EnumMap<>(totalDistribution));
        }

        List<Integer> batchSizes = new ArrayList<>();
        int remCount = totalCount;
        while (remCount > 0) {
            int bs = Math.min(maxPerBatch, remCount);
            batchSizes.add(bs);
            remCount -= bs;
        }

        List<Map<Difficulty, Integer>> result = new ArrayList<>();
        Map<Difficulty, Integer> remainingTargets = new EnumMap<>(totalDistribution);
        int remainingTotal = totalCount;

        for (int i = 0; i < batchSizes.size(); i++) {
            int batchSize = batchSizes.get(i);
            Map<Difficulty, Integer> batchMap = new EnumMap<>(Difficulty.class);

            if (i == batchSizes.size() - 1) {
                // Final batch receives all remainders directly
                for (Difficulty d : Difficulty.values()) {
                    int left = remainingTargets.getOrDefault(d, 0);
                    if (left > 0) {
                        batchMap.put(d, left);
                    }
                }
            } else {
                // Proportional allocation via largest remainder
                Map<Difficulty, Double> exacts = new EnumMap<>(Difficulty.class);
                Map<Difficulty, Double> remainders = new EnumMap<>(Difficulty.class);
                int currentSum = 0;

                for (Difficulty d : Difficulty.values()) {
                    int target = remainingTargets.getOrDefault(d, 0);
                    double exact = ((double) target / remainingTotal) * batchSize;
                    int floor = (int) Math.floor(exact);
                    batchMap.put(d, floor);
                    currentSum += floor;
                    remainders.put(d, exact - floor);
                }

                int needed = batchSize - currentSum;
                while (needed > 0) {
                    Difficulty best = null;
                    double maxRem = -1.0;
                    for (Difficulty d : Difficulty.values()) {
                        double rem = remainders.getOrDefault(d, 0.0);
                        if (rem > maxRem && batchMap.getOrDefault(d, 0) < remainingTargets.getOrDefault(d, 0)) {
                            maxRem = rem;
                            best = d;
                        }
                    }
                    if (best != null) {
                        batchMap.put(best, batchMap.getOrDefault(best, 0) + 1);
                        remainders.put(best, 0.0); // take once per pass
                        needed--;
                    } else {
                        break;
                    }
                }

                // Subtract allocated from remaining targets
                for (Map.Entry<Difficulty, Integer> entry : batchMap.entrySet()) {
                    Difficulty d = entry.getKey();
                    int alloc = entry.getValue();
                    remainingTargets.put(d, Math.max(0, remainingTargets.getOrDefault(d, 0) - alloc));
                }
                remainingTotal -= batchSize;
            }
            result.add(batchMap);
        }
        return result;
    }

    /**
     * Distribute writing modes for MIXED_WRITING evenly across batches.
     * Total mode distribution equals exact requested total.
     */
    public static List<Map<WritingMode, Integer>> createMixedWritingBatches(int totalCount, int maxPerBatch) {
        // First allocate total evenly across the three modes
        Map<WritingMode, Integer> totalDist = new LinkedHashMap<>();
        int base = totalCount / 3;
        int rem = totalCount % 3;
        totalDist.put(WritingMode.JA_TO_VI_TRANSLATION, base + (rem > 0 ? 1 : 0));
        totalDist.put(WritingMode.VI_TO_JA_TRANSLATION, base + (rem > 1 ? 1 : 0));
        totalDist.put(WritingMode.SENTENCE_REORDER, base);

        if (totalCount <= maxPerBatch) {
            return List.of(totalDist);
        }

        List<Integer> batchSizes = createBatchSizes(totalCount);
        List<Map<WritingMode, Integer>> result = new ArrayList<>();
        Map<WritingMode, Integer> remainingTargets = new LinkedHashMap<>(totalDist);
        int remainingTotal = totalCount;

        for (int i = 0; i < batchSizes.size(); i++) {
            int batchSize = batchSizes.get(i);
            Map<WritingMode, Integer> batchMap = new LinkedHashMap<>();

            if (i == batchSizes.size() - 1) {
                for (Map.Entry<WritingMode, Integer> entry : remainingTargets.entrySet()) {
                    if (entry.getValue() > 0) {
                        batchMap.put(entry.getKey(), entry.getValue());
                    }
                }
            } else {
                Map<WritingMode, Double> remainders = new LinkedHashMap<>();
                int currentSum = 0;

                for (Map.Entry<WritingMode, Integer> entry : remainingTargets.entrySet()) {
                    WritingMode mode = entry.getKey();
                    int target = entry.getValue();
                    double exact = ((double) target / remainingTotal) * batchSize;
                    int floor = (int) Math.floor(exact);
                    batchMap.put(mode, floor);
                    currentSum += floor;
                    remainders.put(mode, exact - floor);
                }

                int needed = batchSize - currentSum;
                while (needed > 0) {
                    WritingMode best = null;
                    double maxRem = -1.0;
                    for (Map.Entry<WritingMode, Double> remEntry : remainders.entrySet()) {
                        WritingMode m = remEntry.getKey();
                        if (remEntry.getValue() > maxRem && batchMap.getOrDefault(m, 0) < remainingTargets.getOrDefault(m, 0)) {
                            maxRem = remEntry.getValue();
                            best = m;
                        }
                    }
                    if (best != null) {
                        batchMap.put(best, batchMap.getOrDefault(best, 0) + 1);
                        remainders.put(best, -1.0);
                        needed--;
                    } else {
                        break;
                    }
                }

                for (Map.Entry<WritingMode, Integer> entry : batchMap.entrySet()) {
                    WritingMode mode = entry.getKey();
                    int alloc = entry.getValue();
                    remainingTargets.put(mode, Math.max(0, remainingTargets.getOrDefault(mode, 0) - alloc));
                }
                remainingTotal -= batchSize;
            }
            result.add(batchMap);
        }
        return result;
    }
}

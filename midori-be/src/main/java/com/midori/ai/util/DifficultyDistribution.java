package com.midori.ai.util;

import com.midori.entity.Difficulty;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Canonical difficulty-distribution helper shared between the AI prompt layer,
 * the controller validation, and the BE / FE allocation logic.
 *
 * <p>The percentages are integer percentages in {@code [0, 100]}; the total
 * MUST equal exactly 100. The allocation step uses a deterministic
 * <strong>largest-remainder</strong> pass so the per-difficulty counts sum
 * to the requested total even when the raw products are fractional.
 *
 * <p>Example for {@code N=7, easy=30, medium=50, hard=20}:
 * <ul>
 *   <li>Raw: easy=2.1, medium=3.5, hard=1.4</li>
 *   <li>Integer floors: easy=2, medium=3, hard=1 (sum=6, remainder=1)</li>
 *   <li>Remainders: easy=0.1, medium=0.5, hard=0.4 (largest first → medium)</li>
 *   <li>Final: easy=2, medium=4, hard=1 (sum=7)</li>
 * </ul>
 *
 * <p>This class is final and stateless; all methods are static.
 */
public final class DifficultyDistribution {

    /** Hard upper bound for the requested total question count. */
    public static final int MAX_QUESTIONS = 100;
    /** Hard lower bound for the requested total question count. */
    public static final int MIN_QUESTIONS = 1;

    private DifficultyDistribution() {}

    /**
     * Validate that a total question count is within product bounds.
     *
     * @throws IllegalArgumentException when out of range
     */
    public static void validateCount(int count) {
        if (count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
            throw new IllegalArgumentException(
                    "Question count must be between " + MIN_QUESTIONS
                            + " and " + MAX_QUESTIONS + " (got " + count + ").");
        }
    }

    /**
     * Validate percentage inputs.
     *
     * @param easy   Easy percentage in [0, 100]
     * @param medium Medium percentage in [0, 100]
     * @param hard   Hard percentage in [0, 100]
     * @throws IllegalArgumentException when any value is out of range or the
     *         total does not equal 100
     */
    public static void validatePercentages(int easy, int medium, int hard) {
        if (easy < 0 || easy > 100) {
            throw new IllegalArgumentException("Easy percentage must be in [0, 100] (got " + easy + ").");
        }
        if (medium < 0 || medium > 100) {
            throw new IllegalArgumentException("Medium percentage must be in [0, 100] (got " + medium + ").");
        }
        if (hard < 0 || hard > 100) {
            throw new IllegalArgumentException("Hard percentage must be in [0, 100] (got " + hard + ").");
        }
        if (easy + medium + hard != 100) {
            throw new IllegalArgumentException(
                    "Difficulty percentages must sum to exactly 100 (got "
                            + (easy + medium + hard) + ").");
        }
    }

    /**
     * Compute the deterministic largest-remainder allocation.
     *
     * <p>Returns a map {@code {EASY: e, MEDIUM: m, HARD: h}} where
     * {@code e + m + h == totalCount}.
     *
     * @param totalCount the requested question count (must be {@code >= 1})
     * @param easy   Easy percentage (0..100)
     * @param medium Medium percentage (0..100)
     * @param hard   Hard percentage (0..100)
     */
    public static Map<Difficulty, Integer> allocate(int totalCount, int easy, int medium, int hard) {
        validateCount(totalCount);
        validatePercentages(easy, medium, hard);

        double easyExact   = (easy   / 100.0) * totalCount;
        double mediumExact = (medium / 100.0) * totalCount;
        double hardExact   = (hard   / 100.0) * totalCount;

        int easyCount   = (int) Math.floor(easyExact);
        int mediumCount = (int) Math.floor(mediumExact);
        int hardCount   = (int) Math.floor(hardExact);

        // Compute remainders, sorted DESC by (fractional part, then canonical
        // difficulty order EASY -> MEDIUM -> HARD to break ties consistently).
        double easyRem   = easyExact   - easyCount;
        double mediumRem = mediumExact - mediumCount;
        double hardRem   = hardExact   - hardCount;

        int assigned = easyCount + mediumCount + hardCount;
        int remainder = totalCount - assigned;
        if (remainder < 0) {
            // Floating-point edge case for 0 percentages → trim from the
            // largest floor; this only happens for degenerate inputs that
            // still pass validatePercentages().
            int trim = -remainder;
            // Prefer trimming from the largest bucket so totals stay correct.
            if (hardCount >= trim) {
                hardCount -= trim;
            } else if (mediumCount >= trim) {
                mediumCount -= trim;
            } else {
                easyCount -= trim;
            }
            remainder = 0;
        }
        if (remainder > 0) {
            // Sort difficulties by remainder DESC, tie-break by canonical order.
            Difficulty[] order = new Difficulty[]{
                    Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD
            };
            double[] rems = new double[]{easyRem, mediumRem, hardRem};
            for (int i = 0; i < order.length - 1; i++) {
                for (int j = i + 1; j < order.length; j++) {
                    if (rems[j] > rems[i]
                            || (rems[j] == rems[i] && orderIndex(order[j]) < orderIndex(order[i]))) {
                        double tmpR = rems[i]; rems[i] = rems[j]; rems[j] = tmpR;
                        Difficulty tmpD = order[i]; order[i] = order[j]; order[j] = tmpD;
                    }
                }
            }
            int[] counts = new int[]{easyCount, mediumCount, hardCount};
            for (int k = 0; k < remainder; k++) {
                Difficulty d = order[k % order.length];
                counts[index(d)]++;
            }
            easyCount = counts[0];
            mediumCount = counts[1];
            hardCount = counts[2];
        }

        Map<Difficulty, Integer> out = new EnumMap<>(Difficulty.class);
        out.put(Difficulty.EASY, easyCount);
        out.put(Difficulty.MEDIUM, mediumCount);
        out.put(Difficulty.HARD, hardCount);
        return out;
    }

    /**
     * Format the distribution as a stable, prompt-friendly string.
     * Example: {@code "EASY=3, MEDIUM=5, HARD=2"}.
     */
    public static String formatForPrompt(Map<Difficulty, Integer> distribution) {
        Map<Difficulty, Integer> ordered = new LinkedHashMap<>();
        ordered.put(Difficulty.EASY, distribution.getOrDefault(Difficulty.EASY, 0));
        ordered.put(Difficulty.MEDIUM, distribution.getOrDefault(Difficulty.MEDIUM, 0));
        ordered.put(Difficulty.HARD, distribution.getOrDefault(Difficulty.HARD, 0));
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<Difficulty, Integer> e : ordered.entrySet()) {
            if (!first) sb.append(", ");
            sb.append(e.getKey().name()).append("=").append(e.getValue());
            first = false;
        }
        return sb.toString();
    }

    private static int orderIndex(Difficulty d) {
        switch (d) {
            case EASY:   return 0;
            case MEDIUM: return 1;
            case HARD:   return 2;
            default: throw new IllegalArgumentException("Unknown difficulty: " + d);
        }
    }

    private static int index(Difficulty d) {
        return orderIndex(d);
    }

    /**
     * Normalize a free-form difficulty string to the canonical {@link Difficulty}
     * enum. Accepts case-insensitive {@code "EASY"}, {@code "MEDIUM"},
     * {@code "HARD"} (and the historical {@code "Easy"} / {@code "Medium"} /
     * {@code "Hard"} capitalizations). Returns {@code null} for unknown values.
     */
    public static Difficulty normalize(String raw) {
        if (raw == null) return null;
        String norm = raw.trim().toUpperCase();
        switch (norm) {
            case "EASY":   return Difficulty.EASY;
            case "MEDIUM": return Difficulty.MEDIUM;
            case "HARD":   return Difficulty.HARD;
            default: return null;
        }
    }
}

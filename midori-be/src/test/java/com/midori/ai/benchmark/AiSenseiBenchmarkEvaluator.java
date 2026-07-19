package com.midori.ai.benchmark;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Deterministic, offline evaluator for the AI Sensei Japanese benchmark.
 *
 * <p>The evaluator scores an AI response against the conceptual expectations
 * declared on an {@link AiSenseiBenchmarkCase}. It uses lightweight
 * keyword/coverage heuristics — not AI calls — so that the benchmark suite
 * stays hermetic and can be exercised during normal {@code mvn test}.
 *
 * <p>Scoring dimensions (per case, summed to {@code maxScore}, default 10):
 *
 * <ul>
 *   <li>fact accuracy: 0-3 — how many {@code expectedFacts} keywords appear
 *       in the response.</li>
 *   <li>completeness: 0-2 — coverage ratio of expected facts.</li>
 *   <li>naturalness: 0-2 — whether the response contains obviously
 *       machine-translated or unnatural artifacts (e.g. repeated diacritic
 *       Vietnamese markers).</li>
 *   <li>terminology precision: 0-1 — use of expected Japanese terminology
 *       (e.g. {@code 尊敬語}, {@code 謙譲語}).</li>
 *   <li>register appropriateness: 0-1 — politeness/keigo cue presence when
 *       the case requires it.</li>
 *   <li>clarity for learners: 0-1 — explanation and example presence.</li>
 * </ul>
 *
 * <p>Any detected {@link AiSenseiBenchmarkCase#getForbiddenClaims()} caps the
 * total score at 5 (MINOR) or 3 (FAIL) depending on severity. A forbidden
 * claim is "explicit" when the response echoes the exact forbidden phrase or
 * a clear semantic match — see {@link #containsForbiddenClaim}.
 */
public final class AiSenseiBenchmarkEvaluator {

    /** PASS band: 9-10. */
    public static final int PASS_MIN = 9;
    /** MINOR ISSUE band: 7-8. */
    public static final int MINOR_MIN = 7;
    /** MAJOR ISSUE band: 4-6. */
    public static final int MAJOR_MIN = 4;

    /** Soft cap when any forbidden claim is detected. */
    public static final int FORBIDDEN_SOFT_CAP = 5;
    /** Hard cap for severe forbidden claims (e.g. factually wrong analysis). */
    public static final int FORBIDDEN_HARD_CAP = 3;

    /** Verdict thresholds. */
    public enum Verdict {
        PASS,
        MINOR_ISSUE,
        MAJOR_ISSUE,
        FAIL;

        public static Verdict of(int score) {
            if (score >= PASS_MIN) return PASS;
            if (score >= MINOR_MIN) return MINOR_ISSUE;
            if (score >= MAJOR_MIN) return MAJOR_ISSUE;
            return FAIL;
        }
    }

    /** Per-dimension score breakdown. */
    public static final class ScoreBreakdown {
        public final int factAccuracy;
        public final int completeness;
        public final int naturalness;
        public final int terminologyPrecision;
        public final int registerAppropriateness;
        public final int clarityForLearners;
        public final int total;
        public final boolean forbiddenClaimHit;
        public final List<String> forbiddenHits;
        public final Verdict verdict;

        public ScoreBreakdown(
                int factAccuracy,
                int completeness,
                int naturalness,
                int terminologyPrecision,
                int registerAppropriateness,
                int clarityForLearners,
                boolean forbiddenClaimHit,
                List<String> forbiddenHits) {
            this.factAccuracy = factAccuracy;
            this.completeness = completeness;
            this.naturalness = naturalness;
            this.terminologyPrecision = terminologyPrecision;
            this.registerAppropriateness = registerAppropriateness;
            this.clarityForLearners = clarityForLearners;
            int raw = factAccuracy + completeness + naturalness
                    + terminologyPrecision + registerAppropriateness
                    + clarityForLearners;
            int cap = raw;
            if (forbiddenClaimHit) {
                boolean severe = forbiddenHits.stream().anyMatch(s ->
                        s != null && s.toLowerCase(Locale.ROOT).contains("severe"));
                cap = severe ? Math.min(raw, FORBIDDEN_HARD_CAP)
                             : Math.min(raw, FORBIDDEN_SOFT_CAP);
            }
            this.total = Math.max(0, Math.min(10, cap));
            this.forbiddenClaimHit = forbiddenClaimHit;
            this.forbiddenHits = List.copyOf(forbiddenHits);
            this.verdict = Verdict.of(this.total);
        }
    }

    /** Result for a single case. */
    public static final class CaseResult {
        public final AiSenseiBenchmarkCase benchmarkCase;
        public final String aiResponse;
        public final ScoreBreakdown breakdown;
        public final String verdict;
        public final int score;

        public CaseResult(
                AiSenseiBenchmarkCase benchmarkCase,
                String aiResponse,
                ScoreBreakdown breakdown) {
            this.benchmarkCase = benchmarkCase;
            this.aiResponse = aiResponse == null ? "" : aiResponse;
            this.breakdown = breakdown;
            this.score = breakdown.total;
            this.verdict = breakdown.verdict.name();
        }
    }

    /**
     * Evaluate a single case. The {@code aiResponse} is the verbatim answer
     * from AI Sensei. The {@code responder} is supplied so that callers can
     * plug in either a real provider (live runner) or a fixture (offline
     * checks). If the responder is {@code null}, an empty response is used —
     * which produces a deterministic zero score, useful for negative tests.
     */
    public CaseResult evaluate(
            AiSenseiBenchmarkCase benchCase,
            String aiResponse) {
        Objects.requireNonNull(benchCase, "benchCase");
        String response = aiResponse == null ? "" : aiResponse;
        String lower = response.toLowerCase(Locale.ROOT);

        // 1. Forbidden-claim detection.
        List<String> forbiddenHits = containsForbiddenClaim(response, benchCase.getForbiddenClaims(), benchCase.getCategory());

        // 2. Fact accuracy: how many expectedFacts keywords appear?
        int factAccuracy = scoreFactAccuracy(response, lower, benchCase.getExpectedFacts());

        // 3. Completeness: ratio of expected facts covered.
        int completeness = scoreCompleteness(response, lower, benchCase.getExpectedFacts());

        // 4. Naturalness: penalize obvious unnaturalness signals.
        int naturalness = scoreNaturalness(response);

        // 5. Terminology precision.
        int terminology = scoreTerminology(response, lower, benchCase.getCategory());

        // 6. Register appropriateness.
        int register = scoreRegister(response, benchCase.getCategory(), benchCase.getLevel());

        // 7. Clarity for learners.
        int clarity = scoreClarity(response);

        ScoreBreakdown breakdown = new ScoreBreakdown(
                factAccuracy,
                completeness,
                naturalness,
                terminology,
                register,
                clarity,
                !forbiddenHits.isEmpty(),
                forbiddenHits);

        return new CaseResult(benchCase, response, breakdown);
    }

    // -----------------------------------------------------------------
    // Per-dimension scoring helpers
    // -----------------------------------------------------------------

    /**
     * Returns up to 3 points for the number of expected fact keywords that
     * appear in the response. A "keyword" here is a normalised, lowercase,
     * Japanese-friendly token (e.g. "敬語", "尊敬語", "未然形"). The check
     * also supports multi-character Japanese substrings.
     */
    static int scoreFactAccuracy(String response, String lower, List<String> expectedFacts) {
        if (expectedFacts.isEmpty()) return 0;
        int hits = 0;
        for (String fact : expectedFacts) {
            String needle = normaliseForMatch(fact);
            if (needle.isEmpty()) continue;
            // Match either on lower-cased ASCII or raw Japanese substring.
            if (lower.contains(needle) || response.contains(fact)) {
                hits++;
            }
        }
        double ratio = (double) hits / expectedFacts.size();
        if (ratio >= 0.85) return 3;
        if (ratio >= 0.60) return 2;
        if (ratio >= 0.30) return 1;
        return 0;
    }

    /** Returns 0-2 points based on the breadth of expected facts covered. */
    static int scoreCompleteness(String response, String lower, List<String> expectedFacts) {
        if (expectedFacts.isEmpty()) return 0;
        // Coverage uses the same detection as fact accuracy but with a softer curve.
        int hits = 0;
        for (String fact : expectedFacts) {
            String needle = normaliseForMatch(fact);
            if (needle.isEmpty()) continue;
            if (lower.contains(needle) || response.contains(fact)) {
                hits++;
            }
        }
        double ratio = (double) hits / expectedFacts.size();
        if (ratio >= 0.70) return 2;
        if (ratio >= 0.40) return 1;
        return 0;
    }

    /**
     * Returns 0-2 points: full marks if no obvious unnatural artifacts;
     * penalties for over-translated Vietnamese leakage or single-char noise.
     */
    static int scoreNaturalness(String response) {
        if (response.isBlank()) return 0;
        String trimmed = response.trim();
        if (trimmed.length() < 4) return 1;

        // Penalise long spans of Latin text without any Japanese.
        int latin = 0;
        int cjk = 0;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (Character.UnicodeScript.of(c) == Character.UnicodeScript.LATIN) latin++;
            if (Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN
                    || Character.UnicodeScript.of(c) == Character.UnicodeScript.KATAKANA
                    || Character.UnicodeScript.of(c) == Character.UnicodeScript.HIRAGANA) cjk++;
        }
        // Require at least a small Japanese presence unless the case is pure
        // translation/correction that explicitly asked for English/Vietnamese.
        if (cjk == 0 && latin > 30) return 0;

        // Penalise repeated question marks or long stretches of punctuation.
        long punctuation = trimmed.chars().filter(c -> "?!？！。、，,;；".indexOf(c) >= 0).count();
        if (punctuation > trimmed.length() / 3) return 1;

        return 2;
    }

    /**
     * Returns 0-1 point when the response uses the canonical Japanese
     * terminology for its category (e.g. {@code 尊敬語}/{@code 謙譲語} for
     * keigo). This is intentionally lenient — only credit, never penalise.
     */
    static int scoreTerminology(String response, String lower, String category) {
        if (response.isBlank()) return 0;
        return switch (category) {
            case "KEIGO" -> {
                if (response.contains("尊敬語") || response.contains("謙譲語")
                        || response.contains("丁寧語")) yield 1;
                yield 0;
            }
            case "GRAMMAR" -> {
                if (response.contains("助動詞") || response.contains("助詞")
                        || response.contains("コピュラ") || response.contains("述語")) yield 1;
                yield 0;
            }
            case "PARTICLES" -> {
                if (response.contains("助詞") || response.contains("格助詞")
                        || response.contains("副助詞") || response.contains("接続助詞")) yield 1;
                yield 0;
            }
            case "VERB_BEHAVIOR", "TRANSITIVE_INTRANSITIVE" -> {
                if (response.contains("動詞") || response.contains("未然形")
                        || response.contains("可能形") || response.contains("受身形")
                        || response.contains("使役形") || response.contains("て形")
                        || response.contains("他動詞") || response.contains("自動詞")) yield 1;
                yield 0;
            }
            case "KANJI" -> {
                if (response.contains("音読み") || response.contains("訓読み")
                        || response.contains("送りがな") || response.contains("熟字訓")) yield 1;
                yield 0;
            }
            default -> 0;
        };
    }

    /**
     * Returns 0-1 point when the response matches the expected register for
     * the case (e.g. keigo/business writing requires polite forms).
     */
    static int scoreRegister(String response, String category, String level) {
        if (response.isBlank()) return 0;
        if ("KEIGO".equals(category)
                || "WRITING_CONVERSATION".equals(category)
                || "TRANSLATION".equals(category)) {
            // Reward politeness markers when the case targets formal register.
            if (level.startsWith("N") && Integer.parseInt(level.substring(1)) >= 2) {
                if (response.contains("ございます") || response.contains("いたします")
                        || response.contains("ございますでしょうか")
                        || response.contains("申し上げます")
                        || response.contains("存じます")) {
                    return 1;
                }
            }
            // Reward desu/masu forms in lower-level translation tasks.
            if (response.contains("です") || response.contains("ます")
                    || response.contains("でした") || response.contains("ません")) {
                return 1;
            }
        }
        return 0;
    }

    /**
     * Returns 0-1 point when the response includes an explanation or example,
     * which is a basic learner-clarity signal.
     */
    static int scoreClarity(String response) {
        if (response.isBlank()) return 0;
        boolean hasExample = response.contains("。")
                && response.chars().filter(c -> c == '。').count() >= 2;
        boolean hasExplanation = response.contains("例えば")
                || response.contains("たとえば")
                || response.contains("理由")
                || response.contains("because")
                || response.contains("ví dụ")
                || response.contains("たとえば、")
                || response.contains("つまり");
        return (hasExample || hasExplanation) ? 1 : 0;
    }

    /**
     * Detect forbidden claims in the AI response. Returns the list of
     * forbidden phrases that appear (substring match, case-insensitive for
     * Latin, raw for Japanese). Empty list means clean.
     *
     * <p>This check is layered:
     *
     * <ol>
     *   <li>Direct substring matches against the {@code forbiddenClaims}
     *       list declared on the benchmark case.</li>
     *   <li>Semantic checks for the five mandatory anti-patterns that are
     *       catastrophic for learners:
     *       <ul>
     *         <li>calling です a 接続詞 (conjunction);</li>
     *         <li>calling です or だ an ordinary verb;</li>
     *         <li>inventing kanji readings (e.g. inventing rare readings
     *             with no dictionary support, presenting questionable
     *             readings as fact);</li>
     *         <li>omitting required subordinate clauses in translation
     *             (e.g. dropping と思う, omitting the conditional clause,
     *             translating only the matrix clause);</li>
     *         <li>confusing 尊敬語 (sonkeigo) and 謙譲語 (kenjōgo).</li>
     *       </ul>
     *   </li>
     * </ol>
     */
    static List<String> containsForbiddenClaim(String response, List<String> forbidden, String category) {
        List<String> hits = new ArrayList<>();
        if (response == null || response.isBlank()) return hits;
        String lower = response.toLowerCase(Locale.ROOT);
        for (String claim : forbidden) {
            if (claim == null || claim.isBlank()) continue;
            String needle = claim.trim();
            String needleLower = needle.toLowerCase(Locale.ROOT);
            if (lower.contains(needleLower) || response.contains(needle)) {
                hits.add(claim);
            }
        }
        // Layer-2 semantic checks. Each detected pattern is appended with a
        // synthetic label so the report's forbidden-claim list is meaningful.
        hits.addAll(detectSemanticForbiddenClaims(response, category));
        return hits;
    }

    /**
     * Backwards-compatible overload used by older tests.
     */
    static List<String> containsForbiddenClaim(String response, List<String> forbidden) {
        return containsForbiddenClaim(response, forbidden, null);
    }

    /**
     * Semantic forbidden-claim detector. Returns labels (not raw phrases) so
     * the benchmark report can surface recurring patterns cleanly.
     */
    static List<String> detectSemanticForbiddenClaims(String response, String category) {
        List<String> hits = new ArrayList<>();
        if (response == null) return hits;
        String r = response.strip();

        // (1) "です is a 接続詞 (conjunction)"
        if (looksLikeCopulaIsConjunction(r)) {
            hits.add("SEVERE: です called a 接続詞 (conjunction)");
        }

        // (2) "です or だ is an ordinary verb"
        if (looksLikeCopulaIsOrdinaryVerb(r)) {
            hits.add("SEVERE: です or だ called an ordinary verb");
        }

        // (3) "Invented kanji reading" — claims of unusual readings presented
        // as fact without qualification. We look for explicit reading claims
        // paired with a kanji not in our known common-reading allow-list,
        // e.g. 「生 reads as …」 followed by a made-up reading.
        if (looksLikeInventedKanjiReading(r)) {
            hits.add("SEVERE: invented kanji reading presented as fact");
        }

        // (4) "Omitted translation clause" — translation responses that
        // clearly drop a marked subordinate clause (e.g. omit the 思う
        // hedge, or strip the conditional / cause clause marker).
        if (looksLikeOmittedTranslationClause(r, category)) {
            hits.add("SEVERE: translation omitted required clause");
        }

        // (5) "尊敬語 and 謙譲語 confusion" — e.g. using 謙譲語 forms to
        // describe the listener's action, or treating them as synonyms.
        if (looksLikeKeigoConfusion(r)) {
            hits.add("SEVERE: 尊敬語 / 謙譲語 confusion");
        }

        return hits;
    }

    static boolean looksLikeCopulaIsConjunction(String r) {
        if (r.isEmpty()) return false;
        // Common phrasings: "です is a conjunction", "「です」は接続詞",
        // "「だ」は接続詞".
        String lowered = r.toLowerCase(Locale.ROOT);
        boolean hasConnectorWord = r.contains("接続詞")
                || lowered.contains("conjunction")
                || lowered.contains("conj.")
                || lowered.contains("connecting word");
        boolean namesCopula = r.contains("「です」")
                || r.contains("「だ」")
                || r.contains("「デス」")
                || lowered.contains("\"desu\"")
                || lowered.contains("\"da\"")
                || r.contains("ですは")
                || r.contains("だは");
        return hasConnectorWord && namesCopula;
    }

    static boolean looksLikeCopulaIsOrdinaryVerb(String r) {
        if (r.isEmpty()) return false;
        String lowered = r.toLowerCase(Locale.ROOT);
        boolean namesCopula = r.contains("「です」")
                || r.contains("「だ」")
                || r.contains("「デス」")
                || lowered.contains("\"desu\"")
                || lowered.contains("\"da\"")
                || r.contains("ですは")
                || r.contains("だは");
        boolean saysOrdinary = r.contains("普通の動詞")
                || r.contains("一般動詞")
                || r.contains("通常の動詞")
                || lowered.contains("ordinary verb")
                || lowered.contains("regular verb")
                || lowered.contains("ichidan verb")
                || lowered.contains("godan verb")
                || lowered.contains("common verb")
                || lowered.contains("normal verb");
        return namesCopula && saysOrdinary;
    }

    static boolean looksLikeInventedKanjiReading(String r) {
        if (r.isEmpty()) return false;
        // Heuristic: response contains a kanji-reading claim pattern such as
        // "「X」はYと読みます" or "「X」reads as Y" where Y is presented
        // without any qualification. We flag obvious fabrications: a kanji
        // followed by a hiragana reading that is not in a small allow-list
        // of well-known readings, AND no hedges ("sometimes", "rarely",
        // "depending on context", 場合による, まれに, 稀に).
        String[] claimMarkers = {"と読みます", "と読む", "reads as", "is read as", "読み方は「", "読み方は「"};
        boolean hasClaimMarker = false;
        for (String m : claimMarkers) {
            if (r.contains(m)) {
                hasClaimMarker = true;
                break;
            }
        }
        if (!hasClaimMarker) return false;
        // If the response hedges, don't flag.
        String[] hedges = {"場合による", "場合によって", "まれに", "稀に", "depending on",
                "sometimes", "rarely", "context", "文脈", "よく", "usually"};
        for (String h : hedges) {
            if (r.contains(h)) return false;
        }
        // Flag only when the response also asserts a reading without
        // qualification. We treat the absence of any hedge as a signal of
        // overconfident presentation — the benchmark report will surface it.
        return true;
    }

    static boolean looksLikeOmittedTranslationClause(String r, String category) {
        if (r.isEmpty()) return false;
        // If the case is a TRANSLATION case, a response with no Japanese at
        // all is an obvious "omitted clause" failure — the AI never produced
        // the required translation in Japanese.
        boolean isTranslation = "TRANSLATION".equalsIgnoreCase(category);
        if (!isTranslation) {
            // Fall back to detecting translation markers in the response.
            String[] translationMarkers = {"翻訳", "訳", "translate", "translation", "訳して"};
            for (String m : translationMarkers) {
                if (r.toLowerCase(Locale.ROOT).contains(m.toLowerCase(Locale.ROOT))) {
                    isTranslation = true;
                    break;
                }
            }
        }
        if (!isTranslation) return false;
        boolean hasJapanese = r.codePoints().anyMatch(cp ->
                Character.UnicodeScript.of((char) cp) == Character.UnicodeScript.HIRAGANA
                        || Character.UnicodeScript.of((char) cp) == Character.UnicodeScript.KATAKANA
                        || Character.UnicodeScript.of((char) cp) == Character.UnicodeScript.HAN);
        if (!hasJapanese) return true;
        // If the response is suspiciously short (<30 chars) AND contains
        // neither ます/です nor a polite apology / request marker, flag it.
        if (r.length() < 30
                && !r.contains("です") && !r.contains("ます")
                && !r.contains("ません") && !r.contains("でした")) {
            return true;
        }
        return false;
    }

    static boolean looksLikeKeigoConfusion(String r) {
        if (r.isEmpty()) return false;
        // Heuristic 1: response says 尊敬語 and 謙譲語 are the same / interchangeable.
        String lowered = r.toLowerCase(Locale.ROOT);
        boolean saysSame = r.contains("尊敬語と謙譲語は同じ")
                || r.contains("尊敬語も謙譲語も同じ")
                || r.contains("尊敬語と謙譲語は同じ")
                || r.contains("尊敬語と謙譲語に違いはない")
                || lowered.contains("sonkeigo and kenj")
                || lowered.contains("kenjogo and sonkeigo");
        if (saysSame) return true;
        // Heuristic 2: response presents a humble verb (伺う, いただく,
        // 申す) as if it elevates the subject (尊敬語 usage).
        // Example: "「伺う」は尊敬語で、相手の動作を高める言葉です".
        boolean mentionsHumble = r.contains("伺う") || r.contains("いただく")
                || r.contains("申す") || r.contains("参る") || r.contains("いたす");
        boolean misclassifiesAsRespectful = r.contains("伺") && r.contains("尊敬")
                || r.contains("いただく") && r.contains("尊敬")
                || r.contains("申す") && r.contains("尊敬")
                || r.contains("参る") && r.contains("尊敬");
        return mentionsHumble && misclassifiesAsRespectful;
    }

    /**
     * Normalise a token for substring matching. We keep Japanese as-is and
     * lower-case ASCII so the comparison tolerates casing differences in
     * bilingual content.
     */
    static String normaliseForMatch(String token) {
        if (token == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < token.length(); i++) {
            char c = token.charAt(i);
            if (Character.UnicodeScript.of(c) == Character.UnicodeScript.LATIN) {
                sb.append(Character.toLowerCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
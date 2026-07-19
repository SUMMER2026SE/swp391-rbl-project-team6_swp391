package com.midori.ai.benchmark;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates the structural integrity of the AI Sensei Japanese benchmark
 * dataset. This test runs during normal {@code mvn test} and never invokes
 * any external AI provider.
 *
 * <p>It enforces:
 *
 * <ul>
 *   <li>the 100-case full set has exactly 100 cases;</li>
 *   <li>exactly 10 cases per canonical category;</li>
 *   <li>all case IDs are unique;</li>
 *   <li>all levels are from the canonical set;</li>
 *   <li>expected facts and evaluation criteria are non-empty;</li>
 *   <li>{@code maxScore} is within an acceptable range;</li>
 *   <li>required benchmark topics are present.</li>
 * </ul>
 */
class AiSenseiBenchmarkTest {

    private static final String FULL_RESOURCE = "ai-benchmark/ai-sensei-benchmark.json";
    private static final String SMOKE_RESOURCE = "ai-benchmark/ai-sensei-smoke-benchmark.json";

    @Nested
    @DisplayName("Full 100-case benchmark dataset")
    class FullDataset {

        @Test
        @DisplayName("Loads exactly 100 cases")
        void loadsExactly100() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            assertEquals(100, ds.size(),
                    "Full benchmark must contain exactly 100 cases");
        }

        @Test
        @DisplayName("Has exactly 10 cases per canonical category")
        void hasTenPerCategory() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            Map<String, Integer> counts = ds.categoryCounts();
            for (String cat : AiSenseiBenchmarkDataset.FULL_CATEGORIES) {
                assertEquals(10, counts.getOrDefault(cat, 0),
                        "Category " + cat + " must have 10 cases, has "
                                + counts.getOrDefault(cat, 0));
            }
            // Ensure no extras.
            Set<String> allowed = new HashSet<>(AiSenseiBenchmarkDataset.FULL_CATEGORIES);
            for (String cat : counts.keySet()) {
                assertTrue(allowed.contains(cat),
                        "Unexpected category in dataset: " + cat);
            }
        }

        @Test
        @DisplayName("All case IDs are unique")
        void idsUnique() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            Set<String> ids = new HashSet<>();
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertTrue(ids.add(c.getId()),
                        "Duplicate case ID: " + c.getId());
            }
            assertEquals(100, ids.size());
        }

        @Test
        @DisplayName("Levels are all from the canonical set")
        void levelsValid() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            Set<String> allowedLevels = new HashSet<>(AiSenseiBenchmarkDataset.LEVELS);
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertTrue(allowedLevels.contains(c.getLevel()),
                        "Case " + c.getId() + " has invalid level: " + c.getLevel());
            }
        }

        @Test
        @DisplayName("All cases have non-empty expected facts and criteria")
        void fieldsPopulated() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertFalse(c.getPrompt().isBlank(),
                        "Case " + c.getId() + " has blank prompt");
                assertFalse(c.getExpectedFacts().isEmpty(),
                        "Case " + c.getId() + " has empty expectedFacts");
                assertFalse(c.getEvaluationCriteria().isEmpty(),
                        "Case " + c.getId() + " has empty evaluationCriteria");
            }
        }

        @Test
        @DisplayName("All cases have valid maxScore (1-10)")
        void maxScoreValid() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertTrue(c.getMaxScore() >= 1 && c.getMaxScore() <= 10,
                        "Case " + c.getId() + " has invalid maxScore: " + c.getMaxScore());
            }
        }

        @Test
        @DisplayName("Levels span N5 through N1 and non-JLPT")
        void levelsSpanAll() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            Map<String, Integer> levels = ds.levelCounts();
            for (String required : List.of("N5", "N4", "N3", "N2", "N1", "non-JLPT")) {
                assertTrue(levels.getOrDefault(required, 0) > 0,
                        "Dataset must contain at least one case for level " + required);
            }
        }

        @Test
        @DisplayName("Required benchmark topics are present across cases")
        void requiredTopicsPresent() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            // Aggregate all prompts and expected facts into one searchable text.
            StringBuilder haystack = new StringBuilder();
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                haystack.append(c.getPrompt()).append('\n');
                haystack.append(String.join("\n", c.getExpectedFacts())).append('\n');
                haystack.append(String.join("\n", c.getEvaluationCriteria())).append('\n');
            }
            String text = haystack.toString();

            // Specific topic keywords from the task spec.
            String[] required = {
                    "です", "だ", "は", "が", "こと", "の",
                    "そうだ", "ようだ", "らしい",
                    "ために", "ように", "わけではない", "ものの", "に違いない",
                    "に", "へ", "で", "を",
                    "まで", "までに", "と", "たら", "から", "ので",
                    "によって", "について", "に対して",
                    "ichidan", "godan",
                    "受身形", "使役形", "可能形", "ている",
                    "自動詞", "他動詞",
                    "尊敬語", "謙譲語", "丁寧語",
                    "おっしゃる", "伺う", "いただく", "くださる",
                    "開く", "開ける",
                    "生", "上", "下", "行",
                    "音読み", "訓読み", "送りがな", "熟字訓"
            };
            for (String keyword : required) {
                assertTrue(text.contains(keyword),
                        "Required topic '" + keyword + "' missing from benchmark dataset");
            }
        }

        @Test
        @DisplayName("Forbidden-claim phrases from the task spec are represented")
        void forbiddenClaimsRepresented() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    FULL_RESOURCE, 100, 10,
                    AiSenseiBenchmarkDataset.FULL_CATEGORIES.toArray(new String[0]));
            StringBuilder haystack = new StringBuilder();
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                haystack.append(String.join("\n", c.getForbiddenClaims())).append('\n');
            }
            String text = haystack.toString();

            String[] expectedForbidden = {
                    "です is an ordinary verb",
                    "だ is an ordinary godan verb",
                    "です is a 接続詞",
                    "All -iru / -eru verbs are ichidan",
                    "Godan verbs cannot end in -eru",
                    "を here always marks the direct object",
                    "は always means 'topic'",
                    "が always marks the subject",
                    "に always means 'to'",
                    "尊敬語 and 謙譲語 are the same",
                    "生 is read only as せい"
            };
            for (String phrase : expectedForbidden) {
                assertTrue(text.contains(phrase),
                        "Expected forbidden claim missing from dataset: " + phrase);
            }
        }
    }

    @Nested
    @DisplayName("20-case smoke benchmark dataset")
    class SmokeDataset {

        @Test
        @DisplayName("Loads exactly 20 cases")
        void loadsExactly20() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    SMOKE_RESOURCE, 20, 0); // smoke set is heterogeneous
            assertEquals(20, ds.size());
        }

        @Test
        @DisplayName("All IDs are unique and SMOKE-prefixed")
        void smokeIdsUniqueAndPrefixed() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    SMOKE_RESOURCE, 20, 0);
            Set<String> ids = new HashSet<>();
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertTrue(c.getId().startsWith("SMOKE-"),
                        "Smoke case id must be SMOKE-NN, got " + c.getId());
                assertTrue(ids.add(c.getId()),
                        "Duplicate smoke id: " + c.getId());
            }
            assertEquals(20, ids.size());
        }

        @Test
        @DisplayName("All levels are valid")
        void levelsValid() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    SMOKE_RESOURCE, 20, 0);
            Set<String> allowed = new HashSet<>(AiSenseiBenchmarkDataset.LEVELS);
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                assertTrue(allowed.contains(c.getLevel()),
                        "Smoke case " + c.getId() + " has invalid level: " + c.getLevel());
            }
        }

        @Test
        @DisplayName("All 20 required smoke prompts are present")
        void requiredPromptsPresent() {
            AiSenseiBenchmarkDataset ds = AiSenseiBenchmarkDataset.loadAndValidate(
                    SMOKE_RESOURCE, 20, 0);
            StringBuilder haystack = new StringBuilder();
            for (AiSenseiBenchmarkCase c : ds.cases()) {
                haystack.append(c.getPrompt()).append('\n');
                haystack.append(String.join("\n", c.getExpectedFacts())).append('\n');
            }
            String text = haystack.toString();
            String[] requiredSnippets = {
                    "です",
                    "だ",
                    "「は」と「が」",
                    "「に」と「へ」",
                    "公園を歩く",
                    "ichidan",
                    "ている",
                    "sorry",
                    "late",
                    "彼",
                    "熱",
                    "日本へ住",
                    "昨日",
                    "好き",
                    "開",
                    "生",
                    "おっしゃる",
                    "誘",
                    "お詫び",
                    "わけではない"
            };
            for (String snippet : requiredSnippets) {
                assertTrue(text.contains(snippet),
                        "Smoke dataset missing required keyword: " + snippet);
            }
        }
    }

    @Nested
    @DisplayName("Evaluator (offline, no AI calls)")
    class EvaluatorSelfCheck {

        @Test
        @DisplayName("Empty response yields zero score with FAIL verdict")
        void emptyResponseScoresZero() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-001", "GRAMMAR", "N5",
                    "Test prompt",
                    List.of("です", "copula"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, "");
            assertEquals(0, r.score);
            assertEquals("FAIL", r.verdict);
        }

        @Test
        @DisplayName("Response covering all expected facts scores high")
        void fullCoverageScoresHigh() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-002", "KEIGO", "N3",
                    "Test prompt",
                    List.of("尊敬語", "謙譲語", "丁寧語"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            String response = "尊敬語は相手を高める敬語、謙譲語は自分を下げる敬語、丁寧語はです・ますを使う敬語です。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.score >= 7,
                    "Full-coverage response should score >=7, got " + r.score);
        }

        @Test
        @DisplayName("Forbidden claim caps the score")
        void forbiddenClaimCapsScore() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-003", "GRAMMAR", "N5",
                    "Test prompt",
                    List.of("です"),
                    List.of("です is an ordinary verb"),
                    List.of("correct classification"),
                    10);
            String response = "です is an ordinary verb in Japanese, and 尊敬語 covers it.";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Forbidden claim should be detected");
            assertTrue(r.score <= AiSenseiBenchmarkEvaluator.FORBIDDEN_SOFT_CAP,
                    "Forbidden claim should cap score to <= "
                            + AiSenseiBenchmarkEvaluator.FORBIDDEN_SOFT_CAP
                            + ", got " + r.score);
        }

        @Test
        @DisplayName("Semantic: calling です a 接続詞 is detected and severe")
        void detectsDesuConjunction() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-004", "GRAMMAR", "N5",
                    "Test prompt",
                    List.of("copula"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            String response = "「です」は接続詞で、文と文をつなげる役割です。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Calling です a 接続詞 must be detected");
            assertTrue(r.breakdown.forbiddenHits.stream().anyMatch(s ->
                            s.contains("接続詞")),
                    "Hit list should include the conjunction error, got: "
                            + r.breakdown.forbiddenHits);
            assertTrue(r.score <= AiSenseiBenchmarkEvaluator.FORBIDDEN_HARD_CAP,
                    "Severe forbidden claim should hard-cap score, got " + r.score);
        }

        @Test
        @DisplayName("Semantic: calling です an ordinary verb is detected and severe")
        void detectsDesuOrdinaryVerb() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-005", "GRAMMAR", "N5",
                    "Test prompt",
                    List.of("copula"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            String response = "「です」は普通の動詞で、五段動詞として活用します。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Calling です an ordinary verb must be detected");
            assertTrue(r.score <= AiSenseiBenchmarkEvaluator.FORBIDDEN_HARD_CAP,
                    "Severe forbidden claim should hard-cap score, got " + r.score);
        }

        @Test
        @DisplayName("Semantic: calling だ an ordinary verb is detected and severe")
        void detectsDaOrdinaryVerb() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-006", "GRAMMAR", "N5",
                    "Test prompt",
                    List.of("copula"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            String response = "「だ」は ichidan verb であり、regular verb です。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Calling だ an ordinary verb must be detected");
        }

        @Test
        @DisplayName("Semantic: invented kanji reading is detected when unqualified")
        void detectsInventedKanjiReading() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-007", "KANJI", "N5",
                    "Test prompt",
                    List.of("生", "せい", "なま"),
                    List.of(),
                    List.of("correct readings"),
                    10);
            String response = "「生」は「き」と読みます。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Invented kanji reading should be detected");
        }

        @Test
        @DisplayName("Semantic: hedged kanji reading does NOT trigger the detector")
        void hedgedKanjiReadingIsFine() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-008", "KANJI", "N5",
                    "Test prompt",
                    List.of("生", "せい", "なま"),
                    List.of(),
                    List.of("correct readings"),
                    10);
            String response = "「生」は文脈によって「き」と読まれることもあります。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertFalse(r.breakdown.forbiddenHits.stream().anyMatch(s ->
                            s.contains("invented kanji reading")),
                    "Hedged reading should NOT trigger forbidden claim");
        }

        @Test
        @DisplayName("Semantic: omitted translation clause is detected")
        void detectsOmittedTranslationClause() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-009", "TRANSLATION", "N3",
                    "Test prompt",
                    List.of("彼", "来ない", "思う"),
                    List.of(),
                    List.of("preserve negation"),
                    10);
            String response = "He will come.";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Omitted Japanese clause in a translation should be detected");
        }

        @Test
        @DisplayName("Semantic: 尊敬語 / 謙譲語 confusion is detected")
        void detectsKeigoConfusion() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-010", "KEIGO", "N3",
                    "Test prompt",
                    List.of("尊敬語", "謙譲語"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            // Treating a humble verb as 尊敬語 is a textbook confusion.
            String response = "「伺う」は尊敬語であり、相手の動作を高める敬語です。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertTrue(r.breakdown.forbiddenClaimHit,
                    "Keigo confusion should be detected");
            assertTrue(r.breakdown.forbiddenHits.stream().anyMatch(s ->
                            s.contains("尊敬語") && s.contains("謙譲語")),
                    "Hit should mention 尊敬語 / 謙譲語 confusion, got: "
                            + r.breakdown.forbiddenHits);
        }

        @Test
        @DisplayName("Semantic: clean keigo response is NOT flagged")
        void cleanKeigoResponseNotFlagged() {
            AiSenseiBenchmarkCase c = new AiSenseiBenchmarkCase(
                    "X-011", "KEIGO", "N3",
                    "Test prompt",
                    List.of("尊敬語", "謙譲語", "丁寧語"),
                    List.of(),
                    List.of("correct classification"),
                    10);
            String response = "尊敬語は相手の動作を高め、謙譲語は自分の動作を下げ、丁寧語はです・ますを使う敬語です。";
            AiSenseiBenchmarkEvaluator eval = new AiSenseiBenchmarkEvaluator();
            AiSenseiBenchmarkEvaluator.CaseResult r = eval.evaluate(c, response);
            assertFalse(r.breakdown.forbiddenHits.stream().anyMatch(s ->
                            s.contains("尊敬語") && s.contains("謙譲語")),
                    "Clean keigo response must NOT be flagged, got hits: "
                            + r.breakdown.forbiddenHits);
        }
    }
}